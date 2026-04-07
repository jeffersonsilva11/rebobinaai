// src/pipeline/jobs/enrich-title.ts
// Enriquecimento por IA: gera tags, synopsis PT, curiosidades, embedding, SEO

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { prisma } from '@/lib/db'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface EnrichTitleInput {
  titleId: string
}

export async function enrichTitle({ titleId }: EnrichTitleInput) {
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
  const context = buildContext(title)

  // Executa tudo em paralelo para economizar tempo
  const [enrichment, embedding] = await Promise.all([
    callClaudeEnricher(context),
    generateEmbedding(context.embeddingText),
  ])

  // Salva tudo no banco
  await prisma.$transaction(async (tx) => {
    // Atualiza título com dados da IA
    await tx.$executeRaw`
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
  })

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
  "aiTags": ["tag1", "tag2", ...],
  "aiMoodTags": ["feel-good"|"tense"|"dark"|"uplifting"|"funny"|"romantic"|"inspiring"|"sad"|"scary"|"thought-provoking"|"cozy"|"intense"|"wholesome"],
  "complexity": "low"|"medium"|"high",
  "pace": "slow"|"medium"|"fast",
  "anxietyLevel": 1-5,
  "bingeWorthy": true|false,
  "safeFor": ["relaxing"|"before_sleep"|"bad_day"|"kids"|"date_night"|"family"],
  "notGoodFor": ["anxiety"|"sensitive_topics"|"kids"|"before_sleep"],
  "trivia": [
    {"text": "curiosidade interessante em PT, 1-2 frases"},
    {"text": "segunda curiosidade"},
    {"text": "terceira curiosidade"}
  ],
  "opinionSummary": "2-3 frases em PT resumindo o que o público e crítica acham, baseado nas notas",
  "seoMetaTitle": "máx 60 chars, ex: Oppenheimer (2023) — onde assistir + notas",
  "seoMetaDesc": "máx 160 chars, inclui onde assistir no Brasil se possível",
  "schemaOrg": {
    "@context": "https://schema.org",
    "@type": "${context.type === 'MOVIE' ? 'Movie' : 'TVSeries'}",
    "name": "${context.title}",
    "datePublished": "${context.year}",
    "description": "mesma synopsisPt acima"
  }
}

Regras:
- aiTags: 5-10 tags descritivas livres em inglês (ex: "based-on-true-story", "female-led", "anthology")
- aiMoodTags: 2-4 tags do enum acima
- anxietyLevel: 1=muito tranquilo, 5=máxima tensão/angústia
- safeFor e notGoodFor: apenas o que realmente se aplica
- NUNCA inclua spoilers
- Escreva em PT-BR natural, não tradução literal`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    return JSON.parse(text)
  } catch {
    // Se falhar parse, tenta extrair JSON do texto
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error(`[enrich] Falha ao fazer parse do JSON da IA: ${text.slice(0, 200)}`)
  }
}

// ─────────────────────────────────────
// OpenAI — embedding para busca semântica
// ─────────────────────────────────────
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // limite seguro
  })
  return response.data[0].embedding
}

// ─────────────────────────────────────
// Monta contexto do título para a IA
// ─────────────────────────────────────
function buildContext(title: any) {
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

  // Texto para embedding — quanto mais rico, melhor a busca semântica
  const embeddingText = [
    title.titleOriginal,
    title.titlePt !== title.titleOriginal ? title.titlePt : '',
    `${title.year}`,
    genres,
    `directed by ${director}`,
    `starring ${actors}`,
    title.synopsisPt || '',
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
    synopsis: 'Sinopse não disponível', // viria do TMDB
    imdbScore: title.ratings?.imdbScore,
    cast: actors,
    director,
    embeddingText,
  }
}
