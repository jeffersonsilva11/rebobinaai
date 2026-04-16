'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

const SUGGESTIONS = [
  'série curta sem ansiedade',
  'filme leve pra sexta à noite',
  'algo pra chorar no domingo',
  'animação pra assistir em família',
  'suspense coreano recente',
]

export function HeroSearch() {
  const router = useRouter()
  const [q, setQ] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (q.trim().length < 2) return
    router.push(`/busca?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
        O que você quer
        <br />
        <span className="bg-gradient-to-r from-rebobina-400 to-rebobina-600 bg-clip-text text-transparent">
          assistir hoje?
        </span>
      </h1>
      <p className="mt-6 text-lg text-white/70">
        Descreva em linguagem natural. A IA encontra o match perfeito.
      </p>

      <form onSubmit={submit} className="mx-auto mt-10 max-w-2xl">
        <div className="flex rounded-full border border-white/20 bg-white/5 p-2 backdrop-blur-xl focus-within:border-rebobina-400">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex: série curta sem ansiedade, final feliz"
            className="flex-1 bg-transparent px-4 py-2 text-white placeholder-white/40 outline-none"
            maxLength={200}
          />
          <button
            type="submit"
            className="rounded-full bg-rebobina-500 px-6 py-2 font-medium text-white transition hover:bg-rebobina-600"
          >
            Buscar
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => router.push(`/busca?q=${encodeURIComponent(s)}`)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  )
}
