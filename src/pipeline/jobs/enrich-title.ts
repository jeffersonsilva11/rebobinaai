// src/pipeline/jobs/enrich-title.ts
// Enriquecimento por IA: gera tags, synopsis PT, curiosidades, embedding, SEO

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { prisma } from '@/lib/db'

// Lazy-init para não quebrar no build quando as chaves não estão disponíveis
let _anthropic: Anthropic | null = null
let _openai: OpenAI | null = null

function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _anthropic
}
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

export interface EnrichTitleInput {
  titleId: string
  overview?: string
}

export async function enrichTitle({ titleId, overview }: EnrichTitleInput) {
  const title = await prisma.title.findUnique({
    where: { id: titleId },
    include: {
      genres: { include: { genre: true } },
      ratings: true,
      cast: {
        include: { person: true },
        where: { role: { in: ['ACTOR', 'DIRECTOR'] } },
        orderBy: { order: 'asc' },
        take: 8,
      },
    },
  })

  if (!title) throw new Error(`Título ${titleId} não encontrado`)
  if (title.enrichedAt) {
    console.log(`[enrich] ${title.titleOriginal} já foi enriquecido, pulando`)
    return title
  }

  console.log(`[enrich] Iniciando IA para "${title.titleOriginal}"`)

  // Monta contexto para a IA
  const context = buildContext(title, overview)

  // Executa tudo em paralelo para economizar tempo
  const [enrichment, embedding] = await Promise.all([
    callClaudeEnricher(context),
    generateEmbedding(context.embeddingText),
  ])

  // Salva tudo no banco usando SQL raw (pgvector não suportado nativamente pelo Prisma)
  await prisma.$executeRaw`
    UPDATE titles SET
      synopsis_pt = ${enrichment.synopsisPt},
      synopsis_ai_quote = ${enrichment.aiQuote},
      ai_tags = ${enrichment.aiTags}::text[],
      ai_mood_tags = ${enrichment.aiMoodTags}::text[],
      ai_complexity = ${enrichment.complexity},
      ai_pace = ${enrichment.pace},
      ai_anxiety_level = ${enrichment.anxietyLevel},
      ai_binge_worthy = ${enrichment.bingeWorthy},
      ai_safe_for = ${enrichment.safeFor}::text[],
      ai_not_good_for = ${enrichment.notGoodFor}::text[],
      ai_trivia = ${JSON.stringify(enrichment.trivia)}::jsonb,
      ai_opinion_summary = ${enrichment.opinionSummary},
      seo_meta_title = ${enrichment.seoMetaTitle},
      seo_meta_desc = ${enrichment.seoMetaDesc},
      schema_org = ${JSON.stringify(enrichment.schemaOrg)}::jsonb,
      embedding = ${JSON.stringify(embedding)}::vector,
      status = 'PUBLISHED',
      enriched_at = NOW(),
      updated_at = NOW()
    WHERE id = ${titleId}
  `

  console.log(`[enrich] ✓ "${title.titleOriginal}" publicado`)
  return title
}

// ─────────────────────────────────────
// Claude Haiku — enriquecimento
// ─────────────────────────────────────
async function callClaudeEnricher(context: ReturnType<typeof buildContext>) {
  const prompt = `Você é um especialista em cinema e séries trabalhando para o Rebobina.ai,
um site brasileiro de descoberta de entretenimento.

Analise esse título e retorne SOMENTE um JSON válido, sem markdown, sem explicações.

TÍTULO: ${context.title}
TIPO: ${context.type}
ANO: ${context.year}
DURAÇÃO: ${context.runtime}
GÊNEROS: ${context.genres}
SINOPSE (EN): ${context.synopsis}
NOTA IMDB: ${context.imdbScore ?? 'N/A'}
ELENCO PRINCIPAL: ${context.cast}
DIRETOR: ${context.director}

Retorne exatamente este JSON:
{
  "synopsisPt": "sinopse em português brasileiro, fluida e atrativa, 3-4 frases, sem spoilers",
  "aiQuote": "uma frase de impacto em PT sobre o filme, como um crítico escreveria, máx 120 chars",
  "aiTags": ["tag1", "tag2"],
  "aiMoodTags": ["feel-good"],
  "complexity": "low"|"medium"|"high",
  "pace": "slow"|"medium"|"fast",
  "anxietyLevel": 1,
  "bingeWorthy": true,
  "safeFor": ["relaxing"],
  "notGoodFor": ["anxiety"],
  "trivia": [
    {"text": "curiosidade interessante em PT, 1-2 frases"},
    {"text": "segunda curiosidade"},
    {"text": "terceira curiosidade"}
  ],
  "opinionSummary": "2-3 frases em PT resumindo o que o público e crítica acham",
  "seoMetaTitle": "máx 60 chars",
  "seoMetaDesc": "máx 160 chars",
  "schemaOrg": {
    "@context": "https://schema.org",
    "@type": "${context.type === 'MOVIE' ? 'Movie' : 'TVSeries'}",
    "name": "${context.title}",
    "datePublished": "${context.year}",
    "description": "mesma synopsisPt acima"
  }
}

Regras:
- aiTags: 5-10 tags descritivas livres em inglês
- aiMoodTags: 2-4 tags de: feel-good, tense, dark, uplifting, funny, romantic, inspiring, sad, scary, thought-provoking, cozy, intense, wholesome
- anxietyLevel: 1=muito tranquilo, 5=máxima tensão
- safeFor: valores possíveis: relaxing, before_sleep, bad_day, kids, date_night, family
- notGoodFor: valores possíveis: anxiety, sensitive_topics, kids, before_sleep
- NUNCA inclua spoilers
- Escreva em PT-BR natural`

  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error(`[enrich] Falha ao fazer parse do JSON da IA: ${text.slice(0, 200)}`)
  }
}

// ─────────────────────────────────────
// OpenAI — embedding para busca semântica
// ─────────────────────────────────────
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return response.data[0].embedding
}

// ─────────────────────────────────────
// Monta contexto do título para a IA
// ─────────────────────────────────────
function buildContext(title: any, overview?: string) {
  const director = title.cast
    .filter((c: any) => c.role === 'DIRECTOR')
    .map((c: any) => c.person.name)
    .join(', ') || 'N/A'

  const actors = title.cast
    .filter((c: any) => c.role === 'ACTOR')
    .slice(0, 5)
    .map((c: any) => c.person.name)
    .join(', ')

  const genres = title.genres.map((g: any) => g.genre.nameEn).join(', ')

  const embeddingText = [
    title.titleOriginal,
    title.titlePt !== title.titleOriginal ? title.titlePt : '',
    `${title.year}`,
    genres,
    `directed by ${director}`,
    `starring ${actors}`,
    overview || title.synopsisPt || '',
    title.aiTags?.join(' ') || '',
    title.aiMoodTags?.join(' ') || '',
  ].filter(Boolean).join('. ')

  return {
    title: title.titleOriginal,
    titlePt: title.titlePt,
    type: title.type,
    year: title.year,
    runtime: title.runtimeMin ? `${title.runtimeMin} minutos` : 'N/A',
    genres,
    synopsis: overview || 'Sinopse não disponível',
    imdbScore: title.ratings?.imdbScore,
    cast: actors,
    director,
    embeddingText,
  }
}
