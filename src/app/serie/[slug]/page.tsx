// src/app/serie/[slug]/page.tsx — Página da série (raio-x completo)

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { TitleHero } from '@/components/title/TitleHero'
import { TitleRatings } from '@/components/title/TitleRatings'
import { TitleWhere } from '@/components/title/TitleWhere'
import { TitleCast } from '@/components/title/TitleCast'
import { TitleTrivia } from '@/components/title/TitleTrivia'
import { AiOpinion } from '@/components/title/AiOpinion'
import { RelatedTitles } from '@/components/title/RelatedTitles'

export const revalidate = 86400 // 1 dia

// Pré-renderiza as 500 séries mais recentes (se o banco estiver disponível no build)
export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return []
  try {
    const titles = await prisma.title.findMany({
      where: { status: 'PUBLISHED', type: 'SERIES' },
      orderBy: { updatedAt: 'desc' },
      take: 500,
      select: { slug: true },
    })
    return titles.map((t) => ({ slug: t.slug }))
  } catch {
    return []
  }
}

async function getTitle(slug: string) {
  return prisma.title.findFirst({
    where: { slug, status: 'PUBLISHED', type: 'SERIES' },
    include: {
      genres: { include: { genre: true } },
      ratings: true,
      cast: {
        include: { person: true },
        orderBy: { order: 'asc' },
        where: { role: { in: ['ACTOR', 'DIRECTOR', 'WRITER'] } },
      },
      awards: { orderBy: { year: 'desc' } },
      availability: {
        where: { country: 'BR', isActive: true },
        include: { platform: true },
        orderBy: { accessType: 'asc' },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = await getTitle(params.slug).catch(() => null)
  if (!title) return { title: 'Série não encontrada' }
  return {
    title: title.seoMetaTitle ?? `${title.titlePt} (${title.year}) — Série`,
    description: title.seoMetaDesc ?? title.synopsisPt ?? undefined,
    openGraph: {
      images: title.backdropUrl ? [title.backdropUrl] : [],
    },
  }
}

export default async function SeriePage({ params }: { params: { slug: string } }) {
  const title = await getTitle(params.slug).catch(() => null)
  if (!title) notFound()

  const related = await prisma.title.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: title.id },
      type: 'SERIES',
      genres: { some: { genreId: { in: title.genres.map((g) => g.genreId) } } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    select: {
      id: true,
      slug: true,
      titlePt: true,
      year: true,
      type: true,
      posterUrl: true,
    },
  })

  const trivia = Array.isArray(title.aiTrivia)
    ? (title.aiTrivia as Array<{ text: string }>)
    : null

  return (
    <>
      {title.schemaOrg && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(title.schemaOrg) }}
        />
      )}

      <TitleHero title={title} />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_340px]">
        <div>
          <TitleRatings ratings={title.ratings} />

          {/* Metadados específicos de série */}
          {(title.totalSeasons || title.totalEpisodes) && (
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
              {title.totalSeasons && (
                <span className="rounded-full bg-white/5 px-3 py-1">
                  {title.totalSeasons} temporada{title.totalSeasons > 1 ? 's' : ''}
                </span>
              )}
              {title.totalEpisodes && (
                <span className="rounded-full bg-white/5 px-3 py-1">
                  {title.totalEpisodes} episódio{title.totalEpisodes > 1 ? 's' : ''}
                </span>
              )}
              {title.aiBingeWorthy && (
                <span className="rounded-full bg-rebobina-500/20 px-3 py-1 text-rebobina-300">
                  Binge-worthy
                </span>
              )}
            </div>
          )}

          {title.trailerYoutubeId && (
            <section className="mt-6">
              <div className="aspect-video overflow-hidden rounded-xl">
                <iframe
                  src={`https://www.youtube.com/embed/${title.trailerYoutubeId}`}
                  title={`Trailer de ${title.titlePt}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </section>
          )}

          {title.synopsisPt && (
            <section className="mt-8">
              <h2 className="mb-3 text-xl font-semibold">Sinopse</h2>
              <p className="leading-relaxed text-white/80">{title.synopsisPt}</p>
            </section>
          )}
        </div>

        <TitleWhere availability={title.availability} />
      </div>

      <AiOpinion
        summary={title.aiOpinionSummary}
        sentiment={
          title.ratings
            ? {
                pos: title.ratings.aiSentimentPos,
                neu: title.ratings.aiSentimentNeu,
                neg: title.ratings.aiSentimentNeg,
              }
            : null
        }
      />

      <TitleCast cast={title.cast} />
      <TitleTrivia trivia={trivia} />
      <RelatedTitles titles={related} />
    </>
  )
}
