# ARCHITECTURE — Rebobina.ai

> Meta-streaming brasileiro com IA de recomendação por linguagem natural.

---

## Filosofia

**Banco de dados inteligente + frontend burro.**
Todo processamento pesado (enriquecimento por IA, embeddings, curiosidades,
opiniões, SEO) acontece no pipeline de ingestão, offline. O frontend apenas
lê o que já foi processado e renderiza.

Consequência prática:
- Páginas de título são **ISR** (estáticas regeneradas, não SSR puro)
- A busca é a **única rota dinâmica** de usuário — e ainda assim usa cache Redis 1h
- Crons diários/semanais mantêm "onde assistir" e notas sempre atualizadas

---

## Visão geral

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Usuário   │───▶│  Next.js (ISR)   │───▶│  Postgres + pgv. │
└─────────────┘    │  - /filme/[slug] │    │  - titles        │
                   │  - /busca        │    │  - embedding     │
                   │  - /watchlist    │    │  - ratings       │
                   └────────┬─────────┘    │  - availability  │
                            │              └──────────────────┘
                            ▼                        ▲
                   ┌──────────────────┐              │
                   │  API Routes      │              │
                   │  /api/search     │──────────────┘
                   │  /api/watchlist  │
                   └──────────────────┘
                            ▲
                            │ reads from cache
                   ┌──────────────────┐
                   │  Redis (Upstash) │
                   │  - rate limit    │
                   │  - search cache  │
                   └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pipeline (worker) — roda offline, popula o banco               │
│                                                                 │
│   TMDB ──┐                                                      │
│   OMDb ──┼──▶ ingest-title ──▶ enrich-title (Claude + OpenAI) ──┐
│   YT   ──┘                                              │        │
│                                                         ▼        │
│                                          ┌──────────────────┐   │
│                                          │ Postgres (UPSERT)│   │
│                                          └──────────────────┘   │
│                                                                 │
│   Crons (Vercel):                                               │
│    - sync-availability (diário)                                 │
│    - sync-ratings       (semanal)                               │
│    - new-titles         (diário — trending)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Frontend + API | Next.js 14 App Router | ISR, RSC, edge-ready |
| DB | Postgres 16 + pgvector | SQL robusto + busca vetorial nativa |
| ORM | Prisma | Type-safe, migrations |
| Auth | NextAuth.js + Google OAuth | Padrão, adapter Prisma |
| IA (enriq.) | Claude Haiku | Custo/qualidade para enriquecer títulos |
| IA (busca) | OpenAI `text-embedding-3-small` | 1536-dim, barato, bom |
| Jobs | BullMQ + Redis | Retry, DLQ, concurrency control |
| Cache | Redis (Upstash) | Serverless-friendly |
| Dados | TMDB + OMDb + YouTube | Fontes gratuitas |
| Hosting | Vercel + Railway | Vercel p/ frontend, Railway p/ DB/workers |

---

## Fluxo de requisição — página de filme

1. Usuário acessa `/filme/{slug}`
2. Next.js verifica cache ISR — se válido, retorna estático (< 50ms)
3. Se expirou: server component lê `prisma.title.findUnique({ where: { slug }, include: {...}})`
4. Renderiza `TitleHero`, `TitleRatings`, `TitleWhere`, `TitleTrivia`, `AiOpinion`, `RelatedTitles`
5. `generateMetadata` monta `<title>`, OG tags e JSON-LD `schema.org`

**Zero chamadas a APIs externas no caminho do usuário.** Tudo vem do banco.

---

## Fluxo de requisição — busca IA

1. `POST /api/search` com `{ query }`
2. **Rate limit** 20 req/min/IP via Redis
3. **Cache** — hash da query → retorna do Redis (TTL 1h)
4. **Extract intent** — Claude Haiku interpreta query livre → JSON estruturado
5. **Embed query** — OpenAI gera vetor 1536-dim
6. **Vector search** — `ORDER BY embedding <=> :query` com filtros (pgvector)
7. **Enriched response** — match%, reason, availability BR
8. Cacheia 1h + salva em `search_events` (analytics anônimo)

---

## Segurança

- Chaves de API apenas no servidor (nunca `NEXT_PUBLIC_*`)
- Zod valida **todo** input de usuário antes de processar
- Rate limiting em `/api/search`
- Prisma transações em operações compostas
- LGPD: nunca logar PII; `search_events` guarda `session_id` (UUID), não IP
- SQL raw sanitizado: apenas primitivos/enums injetados (ver `lib/ai/search.ts`)

---

## Evolução planejada

- **Fase 1 (atual):** base + busca + watchlist + raio-x do filme
- **Fase 2:** páginas de ator/série, listas editoriais, R2 para imagens
- **Fase 3:** personalização (Plan.PREMIUM), notificações, trailers embed
- **Fase 4:** app mobile (React Native), API pública
