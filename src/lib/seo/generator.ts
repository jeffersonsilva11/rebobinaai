// src/lib/seo/generator.ts
// Gerador de meta tags + JSON-LD schema.org

import { Metadata } from 'next'

export interface TitleSeoInput {
  titlePt: string
  titleOriginal: string
  year: number
  type: string
  synopsisPt: string | null
  backdropUrl: string | null
  posterUrl: string | null
  seoMetaTitle?: string | null
  seoMetaDesc?: string | null
  schemaOrg?: any
  slug: string
  imdbScore?: number | null
}

export function generateTitleMetadata(t: TitleSeoInput): Metadata {
  const defaultTitle = `${t.titlePt} (${t.year}) — onde assistir`
  const defaultDesc = t.synopsisPt?.slice(0, 160) ??
    `${t.titlePt} (${t.year}): veja onde assistir no Brasil, notas e elenco.`

  return {
    title: t.seoMetaTitle ?? defaultTitle,
    description: t.seoMetaDesc ?? defaultDesc,
    alternates: {
      canonical: `/${t.type === 'SERIES' ? 'serie' : 'filme'}/${t.slug}`,
    },
    openGraph: {
      title: t.seoMetaTitle ?? defaultTitle,
      description: t.seoMetaDesc ?? defaultDesc,
      images: t.backdropUrl ? [t.backdropUrl] : t.posterUrl ? [t.posterUrl] : [],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.titlePt,
      description: defaultDesc,
      images: t.backdropUrl ? [t.backdropUrl] : [],
    },
  }
}

export function buildSchemaOrg(t: TitleSeoInput) {
  if (t.schemaOrg && typeof t.schemaOrg === 'object') return t.schemaOrg

  return {
    '@context': 'https://schema.org',
    '@type': t.type === 'MOVIE' ? 'Movie' : 'TVSeries',
    name: t.titlePt,
    alternateName: t.titleOriginal,
    datePublished: `${t.year}`,
    description: t.synopsisPt ?? undefined,
    image: t.posterUrl ?? undefined,
    aggregateRating: t.imdbScore
      ? {
          '@type': 'AggregateRating',
          ratingValue: t.imdbScore,
          bestRating: 10,
          worstRating: 0,
        }
      : undefined,
  }
}
