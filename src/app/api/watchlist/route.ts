// src/app/api/watchlist/route.ts
// GET/POST /api/watchlist

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const AddSchema = z.object({
  titleId: z.string().cuid(),
  status: z.enum(['WANT', 'WATCHING', 'WATCHED']).default('WANT'),
  notifyAvailable: z.boolean().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      title: {
        include: {
          ratings: true,
          availability: {
            where: { country: 'BR', isActive: true },
            include: { platform: true },
            take: 2,
          },
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  })

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = AddSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Input inválido' }, { status: 400 })
  }

  const item = await prisma.watchlistItem.upsert({
    where: {
      userId_titleId: {
        userId: session.user.id,
        titleId: parsed.data.titleId,
      },
    },
    create: {
      userId: session.user.id,
      titleId: parsed.data.titleId,
      status: parsed.data.status,
      notifyAvailable: parsed.data.notifyAvailable ?? true,
    },
    update: {
      status: parsed.data.status,
      notifyAvailable: parsed.data.notifyAvailable ?? undefined,
    },
    include: { title: true },
  })

  return NextResponse.json({ item })
}
