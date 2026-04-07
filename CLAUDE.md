# REBOBINA.AI — Guia para Claude Code

## O que é esse projeto

Meta-streaming brasileiro com IA de recomendação por linguagem natural.
O usuário descreve o que quer assistir em português — a IA interpreta e retorna
títulos com % de match, onde assistir no Brasil, deeplinks para streaming.

**Filosofia:** banco de dados inteligente + frontend burro.
Todo processamento pesado acontece no pipeline. O frontend só renderiza.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend + API | Next.js 14 (App Router) |
| Banco de dados | PostgreSQL 16 + pgvector |
| ORM | Prisma |
| Auth | NextAuth.js (Google OAuth) |
| IA (enriquecimento) | Anthropic Claude API (Haiku) |
| IA (busca/embeddings) | OpenAI text-embedding-3-small |
| Jobs / Cron | BullMQ + Redis (Upstash) |
| Cache | Redis (Upstash) |
| Dados de conteúdo | TMDB API (gratuita) |
| Notas externas | OMDb API (gratuita) |
| Trailers | YouTube Data API v3 |
| Deploy | Vercel (frontend) + Railway (DB + workers) |
| Storage de imagens | Cloudflare R2 (fase 2, inicial usa TMDB CDN) |

---

## Estrutura de diretórios

```
rebobina/
├── CLAUDE.md                    ← este arquivo
├── .env.example                 ← variáveis necessárias
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
│
├── prisma/
│   ├── schema.prisma            ← schema completo do banco
│   └── migrations/              ← gerado pelo prisma migrate
│
├── src/
│   ├── app/                     ← Next.js App Router
│   │   ├── layout.tsx           ← layout global (nav + footer)
│   │   ├── page.tsx             ← HOME — busca + destaques
│   │   ├── busca/
│   │   │   └── page.tsx         ← RESULTADO DE BUSCA IA
│   │   ├── filme/
│   │   │   └── [slug]/
│   │   │       └── page.tsx     ← PÁGINA DO FILME (raio-x)
│   │   ├── serie/
│   │   │   └── [slug]/
│   │   │       └── page.tsx     ← PÁGINA DA SÉRIE
│   │   ├── ator/
│   │   │   └── [slug]/
│   │   │       └── page.tsx     ← PÁGINA DO ATOR
│   │   ├── watchlist/
│   │   │   └── page.tsx         ← WATCHLIST do usuário (auth)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts ← NextAuth Google OAuth
│   │       ├── search/
│   │       │   └── route.ts     ← POST /api/search — busca IA
│   │       ├── watchlist/
│   │       │   ├── route.ts     ← GET/POST /api/watchlist
│   │       │   └── [id]/
│   │       │       └── route.ts ← PATCH/DELETE /api/watchlist/[id]
│   │       └── webhooks/
│   │           └── cron/
│   │               └── route.ts ← endpoint para Vercel Cron
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── home/
│   │   │   ├── HeroSearch.tsx   ← campo "o que você quer assistir?"
│   │   │   ├── FeaturedCard.tsx ← card destaque editorial
│   │   │   └── TitleGrid.tsx    ← grid de cards
│   │   ├── search/
│   │   │   ├── ChatPanel.tsx    ← painel esquerdo chat
│   │   │   ├── ResultCard.tsx   ← card de resultado com match%
│   │   │   └── RefineChips.tsx  ← chips de refinamento
│   │   ├── title/
│   │   │   ├── TitleHero.tsx    ← backdrop + poster + info
│   │   │   ├── TitleRatings.tsx ← IMDb + RT + Metacritic
│   │   │   ├── TitleCast.tsx    ← elenco
│   │   │   ├── TitleWhere.tsx   ← onde assistir (sidebar)
│   │   │   ├── TitleTrivia.tsx  ← curiosidades IA
│   │   │   ├── AiOpinion.tsx    ← resumo de opinião + sentiment
│   │   │   └── RelatedTitles.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── WatchlistButton.tsx
│   │       └── StreamingBadge.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                ← Prisma client singleton
│   │   ├── auth.ts              ← NextAuth config
│   │   ├── redis.ts             ← Upstash Redis client
│   │   ├── ai/
│   │   │   ├── search.ts        ← busca semântica (embed + pgvector)
│   │   │   ├── enricher.ts      ← enriquecimento de título (Claude)
│   │   │   └── prompts.ts       ← todos os prompts centralizados
│   │   ├── apis/
│   │   │   ├── tmdb.ts          ← TMDB API client
│   │   │   ├── omdb.ts          ← OMDb API client
│   │   │   └── youtube.ts       ← YouTube Data API client
│   │   └── seo/
│   │       └── generator.ts     ← gerador de meta tags + schema.org
│   │
│   ├── pipeline/                ← PIPELINE DE INGESTÃO
│   │   ├── index.ts             ← entry point do worker
│   │   ├── queues.ts            ← definição das filas BullMQ
│   │   ├── jobs/
│   │   │   ├── ingest-title.ts  ← job: ingerir 1 título completo
│   │   │   ├── enrich-title.ts  ← job: IA enriquece 1 título
│   │   │   ├── sync-availability.ts ← job: atualiza onde assistir
│   │   │   └── sync-ratings.ts  ← job: atualiza notas
│   │   └── scripts/
│   │       ├── seed-top-titles.ts  ← popula banco com top títulos
│   │       ├── seed-trending.ts    ← busca trending TMDB
│   │       └── run-job.ts          ← roda job avulso via CLI
│   │
│   └── types/
│       ├── title.ts
│       ├── search.ts
│       └── api.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── PIPELINE.md
│   ├── API.md
│   └── SETUP.md
│
└── scripts/
    ├── setup-local.sh           ← setup completo local
    └── test-pipeline.ts         ← testa pipeline com 5 títulos
```

---

## Regras de desenvolvimento

1. **Nunca** buscar dados na hora da requisição se já estão no banco
2. **Sempre** usar ISR (revalidate) nas páginas de título — não SSR puro
3. **Nunca** expor chaves de API no cliente
4. **Sempre** validar input do usuário com Zod antes de processar
5. **Sempre** usar transações Prisma para operações múltiplas
6. **Cache Redis** em toda resposta da busca IA (TTL 1h por query)
7. **Rate limiting** em `/api/search` — 20 req/min por IP
8. **LGPD** — nunca logar dados pessoais em plain text

---

## Ordem de implementação sugerida

```
Fase 1 — Fundação (fazer primeiro):
  [ ] Setup Prisma schema + migrate
  [ ] Setup NextAuth Google OAuth
  [ ] Setup Redis client
  [ ] TMDB API client + teste
  [ ] Pipeline: ingest-title (1 título completo)
  [ ] Pipeline: enrich-title (IA Claude)
  [ ] Script seed-top-titles (50 títulos para testar)

Fase 2 — Frontend:
  [ ] Layout global (Navbar com auth)
  [ ] Home page (HeroSearch + grid)
  [ ] Página do filme (raio-x completo)
  [ ] Busca IA (chat + resultados)
  [ ] Watchlist (auth required)

Fase 3 — Crons:
  [ ] sync-availability (diário)
  [ ] sync-ratings (semanal)
  [ ] Vercel Cron config

Fase 4 — SEO:
  [ ] generateMetadata em todas as páginas
  [ ] Schema.org JSON-LD
  [ ] Sitemap dinâmico
```
