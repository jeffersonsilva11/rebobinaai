# BACKLOG — Rebobina.ai

> Priorizado por ICE: **I**mpact × **C**onfidence × **E**ase (1–10 cada, produto = ICE score).
> Revisar e re-priorizar a cada sprint (2 semanas).
> Owner sugerido entre colchetes.

---

## Como ler este backlog

- **ICE score** = Impact × Confidence × Ease. Máximo teórico: 1000.
- **Fase** referencia o roadmap do CLAUDE.md.
- Items em **negrito** são candidatos ao próximo sprint.

---

## Tema 1 — Home & Descoberta

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| H1 | **Command palette (Cmd+K) com busca em tempo real** | 9 | 8 | 7 | 504 | 2 | fullstack + ux |
| H2 | **Seção "Em Alta Agora" com títulos trending do TMDB** | 8 | 9 | 8 | 576 | 2 | fullstack |
| H3 | **Carrossel por mood ("Para relaxar", "Para se emocionar")** | 8 | 8 | 7 | 448 | 2 | ux + fullstack |
| H4 | Skeleton loading progressivo nos cards da home | 7 | 9 | 8 | 504 | 2 | fullstack |
| H5 | Seção "Chegando esta semana" (sync com TMDB release dates) | 6 | 7 | 6 | 252 | 3 | fullstack |
| H6 | Personalização leve: reordenar home por favPlatforms do usuário | 7 | 7 | 5 | 245 | 7 | ai + fullstack |
| H7 | Dark/light mode toggle persistido | 5 | 8 | 7 | 280 | 2 | ux + fullstack |

---

## Tema 2 — Página de Título

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| T1 | **Bloco "Onde Assistir" acima do dobramento (hero section)** | 10 | 9 | 8 | 720 | 2 | ux + fullstack |
| T2 | **Deeplinks diretos por plataforma com badge de disponibilidade** | 10 | 9 | 9 | 810 | 2 | fullstack |
| T3 | **FAQPage schema.org** ("Onde assistir X?", "X está na Netflix?") | 9 | 9 | 8 | 648 | 4 | fullstack + seo |
| T4 | **WatchAction + VideoObject schema.org** com eligibleRegion BR | 9 | 9 | 7 | 567 | 4 | fullstack |
| T5 | Trailer embed (YouTube, lazy-loaded) | 7 | 8 | 7 | 392 | 2 | fullstack |
| T6 | Seção de elenco com link para `/ator/[slug]` | 6 | 8 | 7 | 336 | 2 | fullstack |
| T7 | Títulos relacionados (vetorial: "quem gostou deste viu") | 7 | 7 | 6 | 294 | 7 | ai |
| T8 | "AI Opinion" — parágrafo gerado pelo Claude sobre o título | 6 | 8 | 5 | 240 | 2 | ai |
| T9 | Indicador de anxiety level visível (escala visual 1-5) | 7 | 8 | 8 | 448 | 2 | ux |
| T10 | Regressão visual (screenshot diff) em CI para página de título | 6 | 7 | 5 | 210 | 5 | qa |

---

## Tema 3 — Busca IA

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| B1 | **Chips de refinamento pós-resultado** ("mais curto", "só séries", "na Netflix") | 9 | 8 | 7 | 504 | 2 | ux + fullstack |
| B2 | **Exibir % de match + razões** ("Alta aderência ao mood", "Disponível no BR") | 10 | 9 | 7 | 630 | 2 | fullstack + ux |
| B3 | **Fallback inteligente** quando 0 resultados (sugestão alternativa) | 8 | 8 | 7 | 448 | 2 | ai + fullstack |
| B4 | Cache de query normalizada (lowercase + trim + dedup) | 7 | 9 | 9 | 567 | 2 | fullstack |
| B5 | Histórico de buscas recentes (localStorage, anonimizado) | 6 | 8 | 8 | 384 | 2 | fullstack |
| B6 | Busca por ator/diretor ("filmes do Christopher Nolan") | 7 | 7 | 6 | 294 | 7 | ai + fullstack |
| B7 | Rerank híbrido: vector distance + imdbScore + popularidade | 9 | 7 | 5 | 315 | 7 | ai + data |
| B8 | A/B test: rerank v1 vs v2 por hash de sessionId | 8 | 7 | 5 | 280 | 7 | data |
| B9 | BM25 sobre títulos + sinopses (pg_trgm) para nomes próprios | 7 | 7 | 5 | 245 | 7 | ai |
| B10 | Sugestões de busca em tempo real (debounced, Redis cache) | 7 | 7 | 6 | 294 | 2 | fullstack |

---

## Tema 4 — Monetização

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| M1 | **Amazon Associados BR — deeplinks com tag de afiliado** | 10 | 9 | 9 | 810 | 2 | fullstack |
| M2 | **Tracking de cliques em deeplink** (`affiliate_clicks` tabela) | 10 | 9 | 9 | 810 | 2 | fullstack + data |
| M3 | **Dashboard de cliques por plataforma** (Metabase ou SQL) | 8 | 8 | 7 | 448 | 5 | data |
| M4 | Integração com rede de afiliados para Apple TV+, Max, Disney+ | 7 | 6 | 5 | 210 | 3 | fullstack |
| M5 | "Sponsored" slot em resultados de busca (máx 1 por página) | 7 | 5 | 5 | 175 | 8 | ux + fullstack |
| M6 | Newsletter semanal patrocinada (curadoria PT-BR) | 6 | 6 | 6 | 216 | 8 | ux |
| M7 | B2B data API (audiência anonimizada para studios) | 8 | 4 | 3 | 96 | 8 | fullstack + data |

---

## Tema 5 — SEO & GEO

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| S1 | **Sitemap dinâmico** com todos slugs de filmes/séries/atores | 9 | 9 | 9 | 729 | 4 | fullstack |
| S2 | **`/llms.txt`** na raiz (instrui ChatGPT/Perplexity sobre o site) | 8 | 9 | 10 | 720 | 4 | fullstack |
| S3 | **generateMetadata completo** em todas as rotas dinâmicas | 8 | 9 | 8 | 576 | 4 | fullstack |
| S4 | **Densidade factual nas sinopses PT-BR** (onde assistir no corpo do texto) | 8 | 8 | 7 | 448 | 4 | ai |
| S5 | Open Graph + Twitter Card com poster real por título | 7 | 9 | 8 | 504 | 4 | fullstack |
| S6 | Schema.org BreadcrumbList em todas as páginas | 6 | 9 | 9 | 486 | 4 | fullstack |
| S7 | Robots.txt + canonical tags para evitar duplicata | 7 | 9 | 9 | 567 | 4 | fullstack |
| S8 | Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms | 9 | 8 | 6 | 432 | 5 | fullstack |
| S9 | Hreflang (se expandir PT-PT) | 3 | 5 | 7 | 105 | 8 | fullstack |

---

## Tema 6 — Design System

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| D1 | **Tokens Tailwind consolidados** (cores, tipografia, espaçamento, radius) | 8 | 9 | 8 | 576 | 2 | ux |
| D2 | **Motion design: transição poster → hero** (shared element) | 8 | 7 | 5 | 280 | 2 | ux + fullstack |
| D3 | **Liquid Glass effect em modais** (blur + translucidez) | 7 | 7 | 5 | 245 | 2 | ux + fullstack |
| D4 | Componente `StreamingBadge` com cores oficiais de cada plataforma | 7 | 9 | 9 | 567 | 2 | ux |
| D5 | Microinteração: skeleton → conteúdo com fade-up | 7 | 9 | 8 | 504 | 2 | ux + fullstack |
| D6 | Animação de resultado de busca (stagger nos cards) | 6 | 8 | 7 | 336 | 2 | ux |
| D7 | Typography scale: serif em hero de título, sans em UI | 7 | 8 | 8 | 448 | 2 | ux |
| D8 | Componente `MatchMeter` (barra de % match animada) | 8 | 9 | 8 | 576 | 2 | ux + fullstack |

---

## Tema 7 — Performance & Infraestrutura

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| P1 | **ISR em páginas de título** (revalidate 1d) | 9 | 9 | 8 | 648 | 2 | fullstack |
| P2 | **next/image com blur placeholder** para todos os posters | 8 | 9 | 8 | 576 | 2 | fullstack |
| P3 | **Índice pgvector HNSW** para queries de embedding | 9 | 8 | 7 | 504 | 2 | fullstack |
| P4 | Redis cache em resultados de busca (TTL 1h, já implementado) | 9 | 9 | 9 | 729 | 1 | ✅ done |
| P5 | Suspense granular: hero carrega antes do grid | 7 | 8 | 7 | 392 | 2 | fullstack |
| P6 | Edge middleware para rate limit (Vercel Edge) | 7 | 7 | 5 | 245 | 5 | fullstack |
| P7 | Bundle analysis + code splitting agressivo | 7 | 8 | 6 | 336 | 5 | fullstack |
| P8 | Prometheus/Grafana para latência p50/p99 de busca | 7 | 6 | 4 | 168 | 5 | fullstack + data |

---

## Tema 8 — Qualidade & Testes

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| Q1 | **Testes unit (Vitest): parsers de intent, Zod schemas** | 8 | 9 | 8 | 576 | 5 | qa |
| Q2 | **Integration: POST /api/search** (rate limit, cache, 400s) | 9 | 9 | 7 | 567 | 5 | qa |
| Q3 | **IDOR test: DELETE /api/watchlist/[id]** (user A não apaga user B) | 9 | 9 | 8 | 648 | 5 | qa + cybersec |
| Q4 | **E2E Playwright: busca completa** (query → resultado → deeplink) | 9 | 8 | 6 | 432 | 5 | qa |
| Q5 | **E2E Playwright: auth + watchlist flow** | 8 | 8 | 6 | 384 | 5 | qa |
| Q6 | CI: GitHub Actions rodando lint + type-check + unit tests | 8 | 9 | 7 | 504 | 5 | qa + fullstack |
| Q7 | Dependabot + npm audit em CI (falha em high/critical) | 7 | 9 | 9 | 567 | 5 | cybersec |
| Q8 | E2E em webkit (iPhone) — maioria do tráfego BR | 7 | 7 | 6 | 294 | 5 | qa |

---

## Tema 9 — A11Y & LGPD

| # | Item | I | C | E | ICE | Fase | Owner |
|---|------|---|---|---|-----|------|-------|
| L1 | **`/api/user/delete`** — remove tudo em transação (LGPD) | 9 | 8 | 7 | 504 | 6 | fullstack + cybersec |
| L2 | **`/api/user/export`** — JSON com todos os dados do usuário (LGPD) | 8 | 8 | 7 | 448 | 6 | fullstack + cybersec |
| L3 | **Consentimento LGPD explícito no onboarding** (lgpdConsentAt) | 9 | 8 | 7 | 504 | 6 | fullstack + ux |
| L4 | TTL em `search_events.rawQuery` (30 dias, cron de limpeza) | 7 | 8 | 7 | 392 | 6 | fullstack + data |
| L5 | CSP com nonce via middleware (remover unsafe-inline) | 7 | 7 | 5 | 245 | 5 | cybersec |
| L6 | Focus management correto no command palette (a11y) | 7 | 8 | 7 | 392 | 2 | ux + fullstack |
| L7 | Aria-labels em todos os botões de ação (a11y) | 7 | 9 | 9 | 567 | 2 | ux |
| L8 | Contraste WCAG AA em todos os textos | 7 | 9 | 8 | 504 | 2 | ux |

---

## Top 15 por ICE score

| Rank | Item | ICE | Tema |
|------|------|-----|------|
| 1 | M1 Amazon affiliate deeplinks | 810 | Monetização |
| 1 | M2 Tracking de cliques (affiliate_clicks) | 810 | Monetização |
| 3 | T2 Deeplinks com badge por plataforma | 810 | Título |
| 4 | P4 Redis cache busca (já feito) | 729 | Performance |
| 5 | S1 Sitemap dinâmico | 729 | SEO |
| 6 | T1 "Onde Assistir" acima do dobramento | 720 | Título |
| 7 | S2 /llms.txt | 720 | GEO |
| 8 | T3 FAQPage schema.org | 648 | SEO |
| 9 | Q3 IDOR test watchlist | 648 | Qualidade |
| 10 | P1 ISR páginas de título | 648 | Performance |
| 11 | B2 % match + razões visíveis | 630 | Busca |
| 12 | T4 WatchAction schema.org | 567 | SEO |
| 13 | B4 Cache query normalizada | 567 | Busca |
| 13 | D4 StreamingBadge componente | 567 | Design |
| 13 | Q7 Dependabot + npm audit CI | 567 | Qualidade |

---

## Próximo sprint sugerido (2 semanas)

Foco: **monetização + SEO + onde assistir** — maior ROI, menor risco técnico.

1. M1 + M2: Amazon affiliate + tracking (1 dia)
2. T1 + T2: bloco "Onde Assistir" com deeplinks (2 dias)
3. S1 + S2: sitemap dinâmico + llms.txt (1 dia)
4. T3 + T4: schema.org FAQPage + WatchAction (1 dia)
5. D1: tokens Tailwind consolidados (0.5 dia)
6. D4 + D8: StreamingBadge + MatchMeter (1 dia)
7. Q6: CI básico com lint + type-check (0.5 dia)
