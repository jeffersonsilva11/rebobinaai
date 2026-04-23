import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'Rebobina.ai — O que você quer assistir hoje?',
    template: '%s — Rebobina.ai',
  },
  description:
    'Descubra filmes e séries por linguagem natural. IA que entende seu humor e mostra onde assistir no Brasil.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3002'),
  openGraph: {
    locale: 'pt_BR',
    type: 'website',
    siteName: 'Rebobina.ai',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
