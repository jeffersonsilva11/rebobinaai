interface StreamingBadgeProps {
  name: string
  colorHex?: string | null
  accessType?: string
}

export function StreamingBadge({ name, colorHex, accessType }: StreamingBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
      {colorHex && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: colorHex }}
          aria-hidden
        />
      )}
      <span className="font-medium">{name}</span>
      {accessType && accessType !== 'SUBSCRIPTION' && (
        <span className="text-white/40">
          ({accessType === 'RENT' ? 'aluguel' : accessType === 'BUY' ? 'compra' : 'grátis'})
        </span>
      )}
    </span>
  )
}
