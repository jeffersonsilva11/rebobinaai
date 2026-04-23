// src/pipeline/jobs/sync-availability.ts
// Job: sincroniza onde assistir de 1 título (chamado pelo cron)

import { prisma } from '@/lib/db'
import { tmdb } from '@/lib/apis/tmdb'

export async function syncTitleAvailability(titleId: string) {
  const title = await prisma.title.findUnique({
    where: { id: titleId },
    select: { tmdbId: true, type: true },
  })
  if (!title) return

  const providers = await tmdb.getWatchProviders(title.tmdbId, title.type, 'BR')

  await prisma.titleAvailability.updateMany({
    where: { titleId, country: 'BR' },
    data: { isActive: false },
  })

  const br = providers?.BR
  if (!br) return { changes: 0 }

  const entries = [
    ...(br.flatrate ?? []).map((p: any) => ({ ...p, accessType: 'SUBSCRIPTION' as const })),
    ...(br.rent ?? []).map((p: any) => ({ ...p, accessType: 'RENT' as const })),
    ...(br.buy ?? []).map((p: any) => ({ ...p, accessType: 'BUY' as const })),
  ]

  let newOnes = 0

  for (const entry of entries) {
    const platform = await prisma.platform.findFirst({
      where: { tmdbProviderId: entry.provider_id },
    })
    if (!platform) continue

    const wasInactive = await prisma.titleAvailability.findFirst({
      where: {
        titleId,
        platformId: platform.id,
        country: 'BR',
        accessType: entry.accessType,
      },
    })

    await prisma.titleAvailability.upsert({
      where: {
        titleId_platformId_country_accessType: {
          titleId,
          platformId: platform.id,
          country: 'BR',
          accessType: entry.accessType,
        },
      },
      create: {
        titleId,
        platformId: platform.id,
        country: 'BR',
        accessType: entry.accessType,
        isActive: true,
        syncedAt: new Date(),
        deeplinkUrl: br.link ?? null,
      },
      update: {
        isActive: true,
        syncedAt: new Date(),
      },
    })

    if (!wasInactive || !wasInactive.isActive) {
      newOnes++
    }
  }

  return { changes: newOnes }
}
