'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { ChatPanel } from '@/components/search/ChatPanel'
import { RefineChips } from '@/components/search/RefineChips'
import { ResultCard } from '@/components/search/ResultCard'

function BuscaContent() {
  const params = useSearchParams()
  const initialQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [intent, setIntent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro na busca' }))
        setError(err.error ?? 'Erro na busca')
        return
      }
      const data = await res.json()
      setResults(data.results ?? [])
      setIntent(data.intent)
      setQuery(q)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQuery) fetchResults(initialQuery)
  }, [initialQuery, fetchResults])

  function handleRefine(extra: string) {
    fetchResults(`${query}, ${extra}`)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      <ChatPanel
        initialQuery={initialQuery}
        intent={intent}
        onSubmit={fetchResults}
        loading={loading}
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-2xl font-bold">Resultados</h1>
          <p className="mb-4 text-sm text-white/60">
            {results.length > 0
              ? `${results.length} títulos encontrados para "${query}"`
              : loading
              ? 'Buscando...'
              : query
              ? 'Nenhum resultado ainda'
              : 'Digite no chat para começar'}
          </p>

          {query && !loading && <RefineChips onRefine={handleRefine} />}

          {error && (
            <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-white/5" />
            ))}
            {!loading && results.map((r) => (
              <ResultCard key={r.id} result={r} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuscaPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-white/50">Carregando...</div>}>
      <BuscaContent />
    </Suspense>
  )
}
