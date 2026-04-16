interface TitleRatingsProps {
  ratings: {
    imdbScore: number | null
    rtTomatometer: number | null
    metacritic: number | null
  } | null
}

export function TitleRatings({ ratings }: TitleRatingsProps) {
  if (!ratings) return null

  const items = [
    { label: 'IMDb', value: ratings.imdbScore ? ratings.imdbScore.toFixed(1) : null, color: '#F5C518' },
    { label: 'Rotten Tomatoes', value: ratings.rtTomatometer ? `${ratings.rtTomatometer}%` : null, color: '#FA320A' },
    { label: 'Metacritic', value: ratings.metacritic ? `${ratings.metacritic}` : null, color: '#66CC33' },
  ].filter((i) => i.value)

  if (!items.length) return null

  return (
    <section className="mx-auto max-w-7xl px-6 py-6">
      <div className="flex flex-wrap gap-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">{item.label}</p>
              <p className="text-xl font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
