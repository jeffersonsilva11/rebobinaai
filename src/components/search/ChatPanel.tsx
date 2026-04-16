'use client'

import { FormEvent, useState } from 'react'

interface Message {
  role: 'user' | 'ai'
  content: string
}

interface ChatPanelProps {
  initialQuery: string
  intent: any
  onSubmit: (query: string) => void
  loading: boolean
}

export function ChatPanel({ initialQuery, intent, onSubmit, loading }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(
    initialQuery
      ? [{ role: 'user', content: initialQuery }]
      : []
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (input.trim().length < 2 || loading) return
    setMessages((prev) => [...prev, { role: 'user', content: input.trim() }])
    onSubmit(input.trim())
    setInput('')
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/10 md:w-[340px]">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/60">
          Converse com a IA
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-3 rounded-2xl p-3 text-sm ${
              m.role === 'user'
                ? 'bg-rebobina-500/20 text-rebobina-100'
                : 'bg-white/5 text-white/80'
            }`}
          >
            {m.content}
          </div>
        ))}
        {intent?.summary && (
          <div className="mb-3 rounded-2xl bg-white/5 p-3 text-sm text-white/70">
            <span className="mb-1 block text-xs uppercase text-white/40">
              Entendi:
            </span>
            {intent.summary}
          </div>
        )}
        {loading && (
          <div className="mb-3 rounded-2xl bg-white/5 p-3 text-sm text-white/50">
            Pensando...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Refine ou peça outra coisa..."
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none focus:border-rebobina-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || input.trim().length < 2}
            className="rounded-full bg-rebobina-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            →
          </button>
        </div>
      </form>
    </aside>
  )
}
