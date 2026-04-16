import Image from 'next/image'
import Link from 'next/link'
import { StreamingBadge } from '@/components/ui/StreamingBadge'
import { WatchlistButton } from '@/components/ui/WatchlistButton'

type SearchResult = {
  id: string
  slug: string
  title_pt: string
  title_original: string
  year: number
  type: 'MOVIE' | 'SERIES'
  poster_url: string | null
  synopsis_pt: string | null
  imdb_score: number | null
  rt_tomatometer: number | null
  matchScore: number
  aiReason: string
  availability: Array<{
    platformId: number
    platformName: string
    platformSlug: string
    colorHex: string | null
    accessType: string
    deeplinkUrl: string | null
  }>
}

export function ResultCard({ result }: { result: SearchResult }) {
  const primaryLink = result.availability?.find((a) => a.accessType === 'SUBSCRIPTION')?.deeplinkUrl

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 md:flex-row">
      <Link
        href={result.type === 'SERIES' ? `/serie/${result.slug}` : `/filme/${result.slug}`}
        className="relative aspect-[2/3] w-full shrink-0 md:w-48"
      >
        {result.poster_url ? (
          <Image
            src={result.poster_url}
            alt={result.title_pt}
            fill
            sizes="192px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5 text-xs text-white/30">
            sem poster
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={result.type === 'SERIES' ? `/serie/${result.slug}` : `/filme/${result.slug}`}
              className="hover:underline"
            >
              <h3 className="text-xl font-bold">
                {result.title_pt}
              </h3>
            </Link>
            <p className="mt-0.5 text-sm text-white/50">
              {result.year} · {result.type === 'MOVIE' ? 'Filme' : 'Série'}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-rebobina-500/20 px-3 py-1 text-sm font-semibold text-rebobina-300">
            {result.matchScore}% match
          </div>
        </div>

        {result.aiReason && (
          <p className="mt-3 text-sm text-rebobina-300">→ {result.aiReason}</p>
        )}

        {result.synopsis_pt && (
          <p className="mt-2 line-clamp-3 text-sm text-white/70">{result.synopsis_pt}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {result.imdb_score && (
            <span className="text-white/70">
              IMDb <strong className="text-white">{result.imdb_score.toFixed(1)}</strong>
            </span>
          )}
          {result.rt_tomatometer && (
            <span className="text-white/70">
              RT <strong className="text-white">{result.rt_tomatometer}%</strong>
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {result.availability?.map((a) => (
            <StreamingBadge
              key={`${a.platformId}-${a.accessType}`}
              name={a.platformName}
              colorHex={a.colorHex}
              accessType={a.accessType}
            />
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {primaryLink ? (
            <a
              href={primaryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-rebobina-500 px-4 py-2 text-sm font-medium text-white hover:bg-rebobina-600"
            >
              Assistir agora →
            </a>
          ) : (
            <Link
              href={result.type === 'SERIES' ? `/serie/${result.slug}` : `/filme/${result.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              Ver detalhes
            </Link>
          )}
          <WatchlistButton titleId={result.id} />
        </div>
      </div>
    </article>
  )
}
