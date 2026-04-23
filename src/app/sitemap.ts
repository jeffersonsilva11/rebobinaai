// src/app/sitemap.ts
// Sitemap dinâmico para SEO

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3002'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/busca`, changeFrequency: 'weekly', priority: 0.8 },
  ]

  if (!process.env.DATABASE_URL) return staticRoutes

  try {
    const [titles, people] = await Promise.all([
      prisma.title.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, type: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000,
      }),
      prisma.person.findMany({
        where: { titleRoles: { some: { title: { status: 'PUBLISHED' } } } },
        select: { slug: true },
        take: 2000,
      }),
    ])

    const titleRoutes: MetadataRoute.Sitemap = titles.map((t) => ({
      url: `${BASE_URL}/${t.type === 'SERIES' ? 'serie' : 'filme'}/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const personRoutes: MetadataRoute.Sitemap = people.map((p) => ({
      url: `${BASE_URL}/ator/${p.slug}`,
      changeFrequency: 'monthly',
      priority: 0.5,
    }))

    return [...staticRoutes, ...titleRoutes, ...personRoutes]
  } catch {
    return staticRoutes
  }
}
