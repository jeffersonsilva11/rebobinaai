// src/app/api/search/route.ts
// POST /api/search — Busca por linguagem natural com IA

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { authOptions } from '@/lib/auth'
import {
  extractIntent,
  generateQueryEmbedding,
  searchByVector,
  generateReason,
} from '@/lib/ai/search'

// Marca a rota como dinâmica (sem estatização no build)
export const dynamic = 'force-dynamic'

const SearchSchema = z.object({
  query: z.string().min(2).max(500),
  platformFilter: z.array(z.number()).optional(),
  typeFilter: z.enum(['MOVIE', 'SERIES', 'ALL']).default('ALL'),
  page: z.number().default(1),
})

const RATE_LIMIT = parseInt(process.env.SEARCH_RATE_LIMIT ?? '20')
const RATE_WINDOW = 60

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
    return NextResponse.json(JSON.parse(cached))
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
      },
    })
  } catch {
    // Não falha a busca por causa do log
  }
}
