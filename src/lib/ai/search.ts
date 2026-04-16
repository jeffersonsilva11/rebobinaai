// src/lib/ai/search.ts
// Lógica de busca semântica (embedding + pgvector)

import { prisma } from '@/lib/db'
import { EXTRACT_INTENT_PROMPT } from './prompts'
import { getAnthropic, getOpenAI } from './enricher'

export interface SearchIntent {
  type?: 'MOVIE' | 'SERIES' | 'ALL'
  moodTags?: string[]
  maxAnxietyLevel?: number | null
  maxRuntimeMin?: number | null
  complexity?: string | null
  languages?: string[] | null
  safeFor?: string[] | null
  era?: string | null
  summary?: string
}

export async function extractIntent(query: string): Promise<SearchIntent> {
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: EXTRACT_INTENT_PROMPT(query) }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) } catch { /* ignore */ }
    }
    return { type: 'ALL', summary: query }
  }
}

export async function generateQueryEmbedding(query: string, intent: SearchIntent): Promise<number[]> {
  const enrichedQuery = [
    query,
    intent.moodTags?.join(' ') ?? '',
    intent.safeFor?.join(' ') ?? '',
    intent.summary ?? '',
  ].filter(Boolean).join('. ')

  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: enrichedQuery,
  })
  return response.data[0].embedding
}

// Sanitiza valores para uso em SQL (somente caracteres alfanuméricos + _-)
function sanitize(s: string): string {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '')
}

export async function searchByVector(params: {
  embedding: number[]
  intent: SearchIntent
  platformFilter?: number[]
  typeFilter: string
  limit: number
}) {
  const { embedding, intent, platformFilter, typeFilter, limit } = params
  const embeddingStr = JSON.stringify(embedding)

  const typeClause = typeFilter !== 'ALL' ? `AND t.type = '${sanitize(typeFilter)}'` : ''
  const anxietyClause = Number.isInteger(intent.maxAnxietyLevel)
    ? `AND (t.ai_anxiety_level IS NULL OR t.ai_anxiety_level <= ${intent.maxAnxietyLevel})`
    : ''
  const runtimeClause = Number.isInteger(intent.maxRuntimeMin)
    ? `AND (t.runtime_min IS NULL OR t.runtime_min <= ${intent.maxRuntimeMin})`
    : ''
  const moodClause = Array.isArray(intent.moodTags) && intent.moodTags.length
    ? `AND t.ai_mood_tags && ARRAY[${intent.moodTags.map((m: string) => `'${sanitize(m)}'`).join(',')}]::text[]`
    : ''
  const platformClause = platformFilter?.length
    ? `AND EXISTS (
        SELECT 1 FROM title_availability ta2
        WHERE ta2.title_id = t.id
        AND ta2.platform_id = ANY(ARRAY[${platformFilter.filter(Number.isInteger).join(',')}]::int[])
        AND ta2.country = 'BR'
        AND ta2.is_active = true
      )`
    : ''

  const results = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      t.id, t.slug, t.title_pt, t.title_original, t.year, t.type,
      t.runtime_min, t.poster_url, t.ai_mood_tags, t.ai_tags,
      t.ai_anxiety_level, t.ai_pace, t.synopsis_pt, t.ai_opinion_summary,
      t.embedding <=> '${embeddingStr}'::vector AS distance,
      r.imdb_score, r.rt_tomatometer,
      COALESCE(
        json_agg(
          json_build_object(
            'platformId', ta.platform_id,
            'platformName', p.name,
            'platformSlug', p.slug,
            'colorHex', p.color_hex,
            'accessType', ta.access_type,
            'deeplinkUrl', ta.deeplink_url
          )
        ) FILTER (WHERE ta.id IS NOT NULL),
        '[]'
      ) AS availability
    FROM titles t
    LEFT JOIN ratings r ON r.title_id = t.id
    LEFT JOIN title_availability ta ON ta.title_id = t.id
      AND ta.country = 'BR' AND ta.is_active = true
    LEFT JOIN platforms p ON p.id = ta.platform_id
    WHERE t.status = 'PUBLISHED' AND t.embedding IS NOT NULL
      ${typeClause} ${anxietyClause} ${runtimeClause} ${moodClause} ${platformClause}
    GROUP BY t.id, r.imdb_score, r.rt_tomatometer
    ORDER BY distance ASC
    LIMIT ${Number(limit)}
  `)

  return results
}

export function generateReason(title: any, intent: SearchIntent): string {
  const reasons: string[] = []
  if (intent.maxAnxietyLevel && title.ai_anxiety_level && title.ai_anxiety_level <= 2) {
    reasons.push('Muito tranquilo, zero tensão')
  }
  if (intent.moodTags?.includes('feel-good') && title.ai_mood_tags?.includes('feel-good')) {
    reasons.push('Garante bom humor')
  }
  if (intent.safeFor?.includes('before_sleep') && title.ai_mood_tags?.includes('cozy')) {
    reasons.push('Ótimo para assistir antes de dormir')
  }
  if (title.ai_mood_tags?.includes('thought-provoking')) {
    reasons.push('Vai te fazer pensar')
  }
  if (title.imdb_score >= 8.5) {
    reasons.push(`IMDb ${title.imdb_score} — altamente aclamado`)
  }
  return reasons[0] ?? title.synopsis_pt?.slice(0, 100) ?? ''
}
