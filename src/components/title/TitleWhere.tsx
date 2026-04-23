import { StreamingBadge } from '@/components/ui/StreamingBadge'

interface Availability {
  id: string
  accessType: string
  deeplinkUrl: string | null
  platform: {
    id: number
    name: string
    colorHex: string | null
    baseUrlBr: string | null
  }
}

export function TitleWhere({ availability }: { availability: Availability[] }) {
  if (!availability?.length) {
    return (
      <aside className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">
          Onde assistir
        </h3>
        <p className="text-sm text-white/60">
          Ainda não disponível nos streamings brasileiros.
        </p>
      </aside>
    )
  }

  const groups = availability.reduce<Record<string, Availability[]>>((acc, item) => {
    const key = item.accessType
    acc[key] = acc[key] ?? []
    acc[key].push(item)
    return acc
  }, {})

  const labels: Record<string, string> = {
    SUBSCRIPTION: 'Streaming',
    RENT: 'Aluguel',
    BUY: 'Compra',
    FREE: 'Grátis',
  }

  return (
    <aside className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/60">
        Onde assistir no Brasil
      </h3>

      <div className="space-y-4">
        {Object.entries(groups).map(([accessType, items]) => (
          <div key={accessType}>
            <p className="mb-2 text-xs text-white/40">{labels[accessType] ?? accessType}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((a) => {
                const href = a.deeplinkUrl ?? a.platform.baseUrlBr ?? '#'
                return (
                  <a
                    key={a.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:opacity-80"
                  >
                    <StreamingBadge
                      name={a.platform.name}
                      colorHex={a.platform.colorHex}
                    />
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
