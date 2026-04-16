// src/pipeline/jobs/enrich-title.ts
// Enriquecimento por IA: gera tags, synopsis PT, curiosidades, embedding, SEO

import { prisma } from '@/lib/db'
import { callClaudeEnricher, generateEmbedding } from '@/lib/ai/enricher'

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
    callClaudeEnricher({
      title: context.title,
      type: context.type,
      year: context.year,
      runtime: context.runtime,
      genres: context.genres,
      synopsis: context.synopsis,
      imdbScore: context.imdbScore,
      cast: context.cast,
      director: context.director,
    }),
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
