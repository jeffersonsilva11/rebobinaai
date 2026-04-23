// src/app/page.tsx — HOME

import { prisma } from '@/lib/db'
import { HeroSearch } from '@/components/home/HeroSearch'
import { TitleGrid } from '@/components/home/TitleGrid'
import { FeaturedCard } from '@/components/home/FeaturedCard'

export const revalidate = 3600 // ISR — 1 hora

async function getHomeData() {
  // Se não há banco configurado (ambiente de build sem DB), retorna vazio
  if (!process.env.DATABASE_URL) {
    return { trending: [], featured: null }
  }
  const [trending, featured] = await Promise.all([
    prisma.title.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ updatedAt: 'desc' }],
      take: 12,
      select: {
        id: true,
        slug: true,
        titlePt: true,
        year: true,
        type: true,
        posterUrl: true,
        ratings: { select: { imdbScore: true } },
      },
    }),
    prisma.title.findFirst({
      where: {
        status: 'PUBLISHED',
        backdropUrl: { not: null },
        ratings: { imdbScore: { gte: 8 } },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        slug: true,
        titlePt: true,
        year: true,
        type: true,
        backdropUrl: true,
        synopsisAiQuote: true,
        synopsisPt: true,
        ratings: { select: { imdbScore: true } },
      },
    }),
  ])

  return { trending, featured }
}

export default async function HomePage() {
  const { trending, featured } = await getHomeData().catch(() => ({ trending: [], featured: null }))

  return (
    <>
      <HeroSearch />
      {featured && <FeaturedCard title={featured} />}
      <TitleGrid titles={trending} title="Em alta no Rebobina" />
    </>
  )
}
