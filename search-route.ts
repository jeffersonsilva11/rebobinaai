// src/app/api/search/route.ts
// POST /api/search — Busca por linguagem natural com IA

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { headers } from 'next/headers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SearchSchema = z.object({
  query: z.string().min(2).max(500),
  platformFilter: z.array(z.number()).optional(),
  typeFilter: z.enum(['MOVIE', 'SERIES', 'ALL']).default('ALL'),
  page: z.number().default(1),
})

// Rate limiting simples
const RATE_LIMIT = parseInt(process.env.SEARCH_RATE_LIMIT ?? '20')
const RATE_WINDOW = 60 // segundos

export async function POST(req: NextRequest) {
  // 1. Rate limiting por IP
  const ip = headers().get('x-forwarded-for') ?? 'unknown'
  const rateLimitKey = `ratelimit:search:${ip}`
  const current = await redis.incr(rateLimitKey)
  if (current === 1) await redis.expire(rateLimitKey, RATE_WINDOW)
  if (current > RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Muitas buscas. Tente novamente em um minuto.' },
      { status: 429 }
    )
  }

  // 2. Valida input
  const body = await req.json().catch(() => null)
  const parsed = SearchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Query inválida' }, { status: 400 })
  }

  const { query, platformFilter, typeFilter } = parsed.data
  const session = await getServerSession(authOptions)
  const sessionId = headers().get('x-session-id') ?? crypto.randomUUID()

  // 3. Cache — mesma query nas últimas 1h retorna do cache
  const cacheKey = `search:${query.toLowerCase().trim()}:${typeFilter}:${(platformFilter ?? []).join(',')}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json(JSON.parse(cached as string))
  }

  try {
    // 4. IA interpreta a intenção da busca
    const intent = await extractIntent(query)

    // 5. Gera embedding da query
    const queryEmbedding = await generateQueryEmbedding(query, intent)

    // 6. Busca vetorial no banco
    const results = await searchByVector({
      embedding: queryEmbedding,
      intent,
      platformFilter,
      typeFilter,
      limit: 8,
    })

    // 7. Calcula match score e ordena
    const titlesWithScore = results.map((r: any) => ({
      ...r,
      matchScore: Math.round((1 - r.distance) * 100),
      aiReason: generateReason(r, intent),
    })).sort((a: any, b: any) => b.matchScore - a.matchScore)

    const response = {
      query,
      intent,
      results: titlesWithScore,
      total: titlesWithScore.length,
      sessionId,
    }

    // 8. Cache por 1 hora
    await redis.setex(cacheKey, 3600, JSON.stringify(response))

    // 9. Salva evento de busca (analytics)
    await logSearchEvent({
      userId: session?.user?.id ?? null,
      sessionId,
      rawQuery: query,
      interpretedIntent: intent,
      resultsShown: titlesWithScore.map((t: any) => t.id),
    })

    return NextResponse.json(response)

  } catch (err) {
    console.error('[search] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao processar busca. Tente novamente.' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────
// Extrai intenção estruturada da query
// ─────────────────────────────────────
async function extractIntent(query: string) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Extraia a intenção de busca dessa query de entretenimento.
Retorne SOMENTE JSON válido, sem markdown.

Query: "${query}"

JSON:
{
  "type": "MOVIE"|"SERIES"|"ALL",
  "moodTags": ["feel-good"|"tense"|"dark"|"uplifting"|"funny"|"romantic"|"inspiring"|"sad"|"scary"|"thought-provoking"|"cozy"|"intense"],
  "maxAnxietyLevel": 1-5,
  "maxRuntimeMin": number|null,
  "complexity": "low"|"medium"|"high"|null,
  "languages": ["pt"|"en"|"es"|"fr"|"ko"|"ja"|"it"|"de"]|null,
  "safeFor": ["relaxing"|"before_sleep"|"bad_day"|"kids"|"date_night"]|null,
  "era": "classic"|"modern"|"recent"|null,
  "summary": "resumo em 1 frase do que o usuário quer"
}`
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { type: 'ALL', summary: query }
  }
}

// ─────────────────────────────────────
// Gera embedding enriquecido da query
// ─────────────────────────────────────
async function generateQueryEmbedding(query: string, intent: any): Promise<number[]> {
  // Enriquece o texto da query com a intenção extraída para melhor precisão
  const enrichedQuery = [
    query,
    intent.moodTags?.join(' ') ?? '',
    intent.safeFor?.join(' ') ?? '',
    intent.summary ?? '',
  ].filter(Boolean).join('. ')

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: enrichedQuery,
  })
  return response.data[0].embedding
}

// ─────────────────────────────────────
// Busca por similaridade vetorial + filtros
// ─────────────────────────────────────
async function searchByVector({
  embedding,
  intent,
  platformFilter,
  typeFilter,
  limit,
}: {
  embedding: number[]
  intent: any
  platformFilter?: number[]
  typeFilter: string
  limit: number
}) {
  const embeddingStr = JSON.stringify(embedding)

  // Filtros dinâmicos
  const typeClause = typeFilter !== 'ALL' ? `AND t.type = '${typeFilter}'` : ''
  const anxietyClause = intent.maxAnxietyLevel
    ? `AND (t.ai_anxiety_level IS NULL OR t.ai_anxiety_level <= ${intent.maxAnxietyLevel})`
    : ''
  const runtimeClause = intent.maxRuntimeMin
    ? `AND (t.runtime_min IS NULL OR t.runtime_min <= ${intent.maxRuntimeMin})`
    : ''
  const moodClause = intent.moodTags?.length
    ? `AND t.ai_mood_tags && ARRAY[${intent.moodTags.map((m: string) => `'${m}'`).join(',')}]::text[]`
    : ''
  const platformClause = platformFilter?.length
    ? `AND EXISTS (
        SELECT 1 FROM title_availability ta2
        WHERE ta2.title_id = t.id
        AND ta2.platform_id = ANY(ARRAY[${platformFilter.join(',')}]::int[])
        AND ta2.country = 'BR'
        AND ta2.is_active = true
      )`
    : ''

  const results = await prisma.$queryRawUnsafe(`
    SELECT
      t.id,
      t.slug,
      t.title_pt,
      t.title_original,
      t.year,
      t.type,
      t.runtime_min,
      t.poster_url,
      t.ai_mood_tags,
      t.ai_tags,
      t.ai_anxiety_level,
      t.ai_pace,
      t.synopsis_pt,
      t.ai_opinion_summary,
      t.embedding <=> '${embeddingStr}'::vector AS distance,
      r.imdb_score,
      r.rt_tomatometer,
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
      AND ta.country = 'BR'
      AND ta.is_active = true
    LEFT JOIN platforms p ON p.id = ta.platform_id
    WHERE
      t.status = 'PUBLISHED'
      AND t.embedding IS NOT NULL
      ${typeClause}
      ${anxietyClause}
      ${runtimeClause}
      ${moodClause}
      ${platformClause}
    GROUP BY t.id, r.imdb_score, r.rt_tomatometer
    ORDER BY distance ASC
    LIMIT ${limit}
  `)

  return results as any[]
}

// ─────────────────────────────────────
// Gera razão da recomendação (IA)
// ─────────────────────────────────────
function generateReason(title: any, intent: any): string {
  // Regras simples baseadas nos tags — sem custo de IA extra
  const reasons: string[] = []

  if (intent.maxAnxietyLevel && title.ai_anxiety_level <= 2) {
    reasons.push('Muito tranquilo, zero tensão')
  }
  if (intent.moodTags?.includes('feel-good') && title.ai_mood_tags?.includes('feel-good')) {
    reasons.push('Garante bom humor')
  }
  if (intent.safeFor?.includes('before_sleep') && title.ai_safe_for?.includes('before_sleep')) {
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

// ─────────────────────────────────────
// Log do evento de busca
// ─────────────────────────────────────
async function logSearchEvent(data: {
  userId: string | null
  sessionId: string
  rawQuery: string
  interpretedIntent: any
  resultsShown: string[]
}) {
  try {
    await prisma.searchEvent.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        rawQuery: data.rawQuery,
        interpretedIntent: data.interpretedIntent,
        resultsShown: data.resultsShown,
        createdAt: new Date(),
      },
    })
  } catch {
    // Não falha a busca por causa do log
  }
}
