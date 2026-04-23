import Image from 'next/image'
import { WatchlistButton } from '@/components/ui/WatchlistButton'

interface TitleHeroProps {
  title: {
    id: string
    titlePt: string
    titleOriginal: string
    year: number
    endYear: number | null
    type: string
    runtimeMin: number | null
    totalSeasons: number | null
    ratingAge: string | null
    posterUrl: string | null
    backdropUrl: string | null
    synopsisAiQuote: string | null
    aiMoodTags: string[]
  }
}

export function TitleHero({ title }: TitleHeroProps) {
  return (
    <section className="relative">
      {title.backdropUrl && (
        <div className="absolute inset-0 h-[60vh]">
          <Image
            src={title.backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
        </div>
      )}

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-6 pt-16 pb-12 md:flex-row md:pt-24">
        <div className="relative w-48 shrink-0 self-start overflow-hidden rounded-xl border border-white/10 shadow-2xl md:w-64">
          <div className="relative aspect-[2/3]">
            {title.posterUrl && (
              <Image
                src={title.posterUrl}
                alt={title.titlePt}
                fill
                sizes="256px"
                className="object-cover"
              />
            )}
          </div>
        </div>

        <div className="flex-1 pt-4">
          <p className="text-xs uppercase tracking-widest text-rebobina-400">
            {title.type === 'MOVIE' ? 'Filme' : 'Série'}
          </p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">{title.titlePt}</h1>
          {title.titleOriginal !== title.titlePt && (
            <p className="mt-1 text-white/50">{title.titleOriginal}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span>{title.year}{title.endYear ? `–${title.endYear}` : title.type === 'SERIES' ? '–' : ''}</span>
            {title.runtimeMin && <span>· {title.runtimeMin}min</span>}
            {title.totalSeasons && <span>· {title.totalSeasons} temporadas</span>}
            {title.ratingAge && (
              <span className="rounded border border-white/20 px-1.5 py-0.5 text-xs">
                {title.ratingAge}
              </span>
            )}
          </div>

          {title.synopsisAiQuote && (
            <p className="mt-6 max-w-2xl text-xl italic text-white/80">
              &quot;{title.synopsisAiQuote}&quot;
            </p>
          )}

          {title.aiMoodTags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {title.aiMoodTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6">
            <WatchlistButton titleId={title.id} />
          </div>
        </div>
      </div>
    </section>
  )
}
