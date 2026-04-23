// src/app/api/watchlist/[id]/route.ts
// PATCH/DELETE /api/watchlist/[id]

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  status: z.enum(['WANT', 'WATCHING', 'WATCHED']).optional(),
  userRating: z.number().min(1).max(5).optional(),
  userReview: z.string().max(2000).optional(),
  notifyAvailable: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Input inválido' }, { status: 400 })
  }

  // Garante que o item pertence ao usuário
  const item = await prisma.watchlistItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.watchlistItem.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      watchedAt: parsed.data.status === 'WATCHED' ? new Date() : undefined,
    },
  })

  return NextResponse.json({ item: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const item = await prisma.watchlistItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.watchlistItem.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
