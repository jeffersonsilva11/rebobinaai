// src/app/busca/layout.tsx — metadata da página de busca

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar — Rebobina.ai',
  description:
    'Descubra filmes e séries com busca por linguagem natural. Descreva o que você quer assistir e nossa IA encontra o match perfeito, com onde assistir no Brasil.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Buscar filmes e séries — Rebobina.ai',
    description:
      'Busca com IA em português. Diga o mood, o tipo de história, e receba recomendações com % de match e onde assistir.',
    type: 'website',
  },
}

export default function BuscaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
