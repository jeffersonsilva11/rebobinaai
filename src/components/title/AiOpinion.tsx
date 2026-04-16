interface AiOpinionProps {
  summary: string | null
  sentiment: {
    pos: number | null
    neu: number | null
    neg: number | null
  } | null
}

export function AiOpinion({ summary, sentiment }: AiOpinionProps) {
  if (!summary && !sentiment) return null

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <h2 className="mb-4 text-2xl font-bold">Opinião da IA</h2>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        {summary && (
          <p className="text-white/80 leading-relaxed">{summary}</p>
        )}

        {sentiment && (sentiment.pos || sentiment.neu || sentiment.neg) && (
          <div className="mt-5 space-y-2">
            <Bar label="Positivo" value={sentiment.pos ?? 0} color="#4ade80" />
            <Bar label="Neutro" value={sentiment.neu ?? 0} color="#94a3b8" />
            <Bar label="Negativo" value={sentiment.neg ?? 0} color="#f87171" />
          </div>
        )}
      </div>
    </section>
  )
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
