interface TitleTriviaProps {
  trivia: Array<{ text: string }> | null
}

export function TitleTrivia({ trivia }: TitleTriviaProps) {
  if (!trivia || trivia.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <h2 className="mb-4 text-2xl font-bold">Curiosidades</h2>
      <ul className="space-y-3">
        {trivia.map((t, i) => (
          <li
            key={i}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
          >
            <span className="mr-2 text-rebobina-400">→</span>
            {t.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
