'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="text-rebobina-400">◉</span>
          <span>Rebobina.ai</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/busca"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Buscar
          </Link>

          {status === 'loading' ? (
            <div className="h-8 w-20 animate-pulse rounded bg-white/5" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/watchlist"
                className="text-sm text-white/70 transition hover:text-white"
              >
                Watchlist
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 transition hover:bg-white/5"
              >
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? 'avatar'}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm">Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium transition hover:bg-white/20"
            >
              Entrar
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
