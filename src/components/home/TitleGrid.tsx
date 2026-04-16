import Image from 'next/image'
import Link from 'next/link'

type TitleItem = {
  id: string
  slug: string
  titlePt: string
  year: number
  type: string
  posterUrl: string | null
  ratings: { imdbScore: number | null } | null
}

export function TitleGrid({ titles, title }: { titles: TitleItem[]; title: string }) {
  if (!titles.length) return null

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {titles.map((t) => (
          <Link
            key={t.id}
            href={t.type === 'SERIES' ? `/serie/${t.slug}` : `/filme/${t.slug}`}
            className="group"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/5">
              {t.posterUrl ? (
                <Image
                  src={t.posterUrl}
                  alt={t.titlePt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-white/30">
                  sem poster
                </div>
              )}
              {t.ratings?.imdbScore && (
                <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium">
                  ⭐ {t.ratings.imdbScore.toFixed(1)}
                </div>
              )}
            </div>
            <h3 className="mt-2 line-clamp-1 text-sm font-medium">
              {t.titlePt}
            </h3>
            <p className="text-xs text-white/50">{t.year}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
