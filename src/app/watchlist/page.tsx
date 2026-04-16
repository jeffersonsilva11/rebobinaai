// src/app/watchlist/page.tsx — Watchlist do usuário (auth)

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Image from 'next/image'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StreamingBadge } from '@/components/ui/StreamingBadge'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sua watchlist — Rebobina.ai',
  description: 'Sua lista pessoal de filmes e séries para assistir no Rebobina.ai.',
  robots: { index: false, follow: false },
}

export default async function WatchlistPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      title: {
        include: {
          ratings: true,
          availability: {
            where: { country: 'BR', isActive: true },
            include: { platform: true },
            take: 3,
          },
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">Sua watchlist</h1>

      {items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-lg text-white/70">Sua watchlist está vazia.</p>
          <Link
            href="/busca"
            className="mt-4 inline-block rounded-full bg-rebobina-500 px-5 py-2 text-sm font-medium"
          >
            Descubra algo pra assistir
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.id} className="group">
              <Link
                href={
                  item.title.type === 'SERIES'
                    ? `/serie/${item.title.slug}`
                    : `/filme/${item.title.slug}`
                }
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
                  {item.title.posterUrl && (
                    <Image
                      src={item.title.posterUrl}
                      alt={item.title.titlePt}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover transition group-hover:scale-105"
                    />
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === 'WATCHED'
                        ? 'bg-emerald-500/80'
                        : item.status === 'WATCHING'
                        ? 'bg-amber-500/80'
                        : 'bg-rebobina-500/80'
                    }`}
                  >
                    {item.status === 'WANT' ? 'Quero ver' : item.status === 'WATCHING' ? 'Vendo' : 'Visto'}
                  </span>
                </div>
                <h3 className="mt-2 line-clamp-1 text-sm font-medium">{item.title.titlePt}</h3>
                <p className="text-xs text-white/50">{item.title.year}</p>
              </Link>

              {item.title.availability.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.title.availability.slice(0, 2).map((a) => (
                    <StreamingBadge
                      key={a.id}
                      name={a.platform.name}
                      colorHex={a.platform.colorHex}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
