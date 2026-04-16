// src/pipeline/jobs/sync-ratings.ts
// Job: sincroniza notas IMDb/RT de 1 título via OMDb

import { prisma } from '@/lib/db'
import { omdb } from '@/lib/apis/omdb'

export async function syncTitleRatings(titleId: string) {
  const title = await prisma.title.findUnique({
    where: { id: titleId },
    select: { id: true, imdbId: true },
  })
  if (!title?.imdbId) return

  const ratings = await omdb.getByImdbId(title.imdbId)
  if (!ratings) return

  await prisma.rating.upsert({
    where: { titleId },
    create: {
      titleId,
      imdbScore: ratings.imdbRating,
      imdbVotes: ratings.imdbVotes,
      rtTomatometer: ratings.rtScore,
      metacritic: ratings.metacriticScore,
    },
    update: {
      imdbScore: ratings.imdbRating ?? undefined,
      imdbVotes: ratings.imdbVotes ?? undefined,
      rtTomatometer: ratings.rtScore ?? undefined,
      metacritic: ratings.metacriticScore ?? undefined,
      lastSyncedAt: new Date(),
    },
  })
}
