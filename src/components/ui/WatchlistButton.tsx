'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Button } from './Button'

export function WatchlistButton({ titleId }: { titleId: string }) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  async function handleClick() {
    if (!session?.user) {
      signIn('google')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleId, status: 'WANT' }),
      })
      if (res.ok) setAdded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={added ? 'secondary' : 'primary'}
      onClick={handleClick}
      disabled={loading}
    >
      {added ? '✓ Na watchlist' : '+ Watchlist'}
    </Button>
  )
}
