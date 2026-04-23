'use client'

const CHIPS = [
  'mais curto',
  'mais leve',
  'sem violência',
  'final feliz',
  'pt-BR',
  'recente',
]

export function RefineChips({ onRefine }: { onRefine: (extra: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((c) => (
        <button
          key={c}
          onClick={() => onRefine(c)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
        >
          + {c}
        </button>
      ))}
    </div>
  )
}
