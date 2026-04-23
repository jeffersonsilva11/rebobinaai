import Image from 'next/image'
import Link from 'next/link'

type FeaturedTitle = {
  slug: string
  titlePt: string
  year: number
  type: string
  backdropUrl: string | null
  synopsisAiQuote: string | null
  synopsisPt: string | null
  ratings: { imdbScore: number | null } | null
}

export function FeaturedCard({ title }: { title: FeaturedTitle }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href={title.type === 'SERIES' ? `/serie/${title.slug}` : `/filme/${title.slug}`}
        className="group block overflow-hidden rounded-2xl border border-white/10"
      >
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          {title.backdropUrl && (
            <Image
              src={title.backdropUrl}
              alt={title.titlePt}
              fill
              priority
              sizes="100vw"
              className="object-cover transition group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <span className="text-xs uppercase tracking-widest text-rebobina-400">
              Destaque da semana
            </span>
            <h3 className="mt-2 text-3xl font-bold md:text-4xl">{title.titlePt}</h3>
            <p className="mt-1 text-sm text-white/60">{title.year}</p>
            {title.synopsisAiQuote && (
              <p className="mt-3 max-w-2xl text-lg italic text-white/80">
                &quot;{title.synopsisAiQuote}&quot;
              </p>
            )}
          </div>
        </div>
      </Link>
    </section>
  )
}
