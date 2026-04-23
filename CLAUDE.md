# REBOBINA.AI — Guia para Claude Code

> **Regra mestre:** este arquivo é o mapa vivo do projeto. Sempre que uma
> feature for concluída, uma decisão de arquitetura for tomada ou um novo
> risco for descoberto, atualize a seção correspondente. Se um PR muda
> algo que está aqui e você não atualizou, o PR está incompleto.

---

## O que esse projeto é

Meta-streaming brasileiro com IA de recomendação por linguagem natural.
O usuário descreve o que quer assistir em português — a IA interpreta e
retorna títulos com % de match, onde assistir no Brasil e deeplinks.

**Filosofia:** banco de dados inteligente + frontend burro.
Todo processamento pesado acontece no pipeline offline. O frontend só renderiza.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend + API | Next.js 14 (App Router) |
| Banco de dados | PostgreSQL 16 + pgvector + pg_trgm + unaccent |
| ORM | Prisma |
| Auth | NextAuth.js (Google OAuth) |
| IA (enriquecimento) | Anthropic Claude Haiku 4.5 |
| IA (busca/embeddings) | OpenAI text-embedding-3-small (1536d) |
| Jobs / Cron | BullMQ + Redis (Upstash em prod) |
| Cache | Redis |
| Dados de conteúdo | TMDB API |
| Notas externas | OMDb API |
| Trailers | YouTube Data API v3 |
| Deploy | Vercel (web) + Railway (DB + workers) |
| Storage de imagens (fase 2) | Cloudflare R2 — MVP usa TMDB CDN |

---

## Agentes especialistas

Em `agents/` vivem 6 perfis que você deve consultar (ou invocar via Agent
tool se mover para `.claude/agents/`) antes de tocar em código fora do
seu domínio:

| Agente | Use para… |
|--------|-----------|
| `ux-ui-designer` | layout, hierarquia, microanimações, tokens, a11y, copy de UI |
| `fullstack-developer` | features ponta-a-ponta, schema Prisma, API routes, RSC vs client |
| `ai-automation-specialist` | prompts, pipeline BullMQ, busca vetorial, custo/latência de IA |
| `qa-specialist` | estratégia de testes, E2E Playwright, casos de borda |
| `cybersecurity-specialist` | OWASP, LGPD, auth, CSP, review de PR do ponto de vista de ataque |
| `data-science-specialist` | KPIs, queries analíticas, rerank, experimentos A/B |

**Regra:** toda mudança relevante passa mentalmente por 2+ agentes antes
do commit. Feature nova = design + dev + qa + segurança, no mínimo.

---

## Estado atual da implementação

**Última atualização:** 2026-04-23

### ✅ Concluído

- Schema Prisma completo (30+ models, pgvector, pg_trgm, unaccent)
- Pipeline BullMQ: `ingest-title`, `enrich-title`, `sync-availability`, `sync-ratings`
- Páginas: `/`, `/busca`, `/filme/[slug]`, `/serie/[slug]`, `/ator/[slug]`, `/watchlist`
- APIs: `/api/search` (Zod + rate limit + cache Redis), `/api/watchlist`, NextAuth, `/api/webhooks/cron`
- NextAuth Google OAuth
- Vercel Cron configurado (`vercel.json`)
- Docker Compose local (Postgres 5433, Redis 6380, Redis Commander 8082 opcional)
- Scripts de setup: `scripts/setup-local.sh` (automatiza tudo, inclui seed mock por padrão)
- Scripts de seed: `seed-platforms.ts`, `seed-mock.ts` (10 títulos sem APIs externas), `seed-top-titles.ts` (real, via TMDB + IA), `seed-trending.ts`
- Prompts centralizados em `src/lib/ai/prompts.ts` (`ENRICH_TITLE_PROMPT`, `EXTRACT_INTENT_PROMPT`, `PERSON_BIO_PROMPT`)

### 🔒 Correções de segurança aplicadas

- **SQL injection corrigido** em `src/lib/ai/search.ts`: `$queryRawUnsafe` substituído por `Prisma.sql` parametrizado (embedding, moodTags, platformFilter, typeFilter, limit).
- **CSP endurecido** em `next.config.js`: `unsafe-eval` removido em produção; `base-uri`, `form-action`, `frame-ancestors 'none'`, `object-src 'none'`, `Permissions-Policy` adicionados; `connect-src` restrito às APIs reais.
- **Rate-limit hardened** em `/api/search`: pega primeiro IP de `X-Forwarded-For` (não o header inteiro); bucket por `userId` quando autenticado (reduz spoofing).
- **Cron** já está protegido com `Authorization: Bearer ${CRON_SECRET}`.

### 🚧 Em aberto (com owner sugerido)

- [ ] Testes (unit, integration, E2E) — `qa-specialist` toca primeiro
- [ ] Documentação em `docs/` (são stubs) — fullstack + designer
- [ ] CSP com nonce via middleware (remover `unsafe-inline` de prod) — cybersec
- [ ] Endpoints LGPD: `/api/user/export`, `/api/user/delete` — cybersec + fullstack
- [ ] Dashboard de métricas básicas — data-science
- [ ] Rerank híbrido (vector + popularidade) — ai + data-science

---

## Estrutura de diretórios

```
rebobina/
├── CLAUDE.md                    ← este arquivo (mantenha atualizado)
├── .env                         ← só DATABASE_URL, usado pelo Prisma CLI
├── .env.local                   ← todas as vars, usado pelo Next.js
├── .env.example                 ← template commitado
├── package.json
├── next.config.js               ← CSP, headers, remotePatterns
├── tailwind.config.ts
├── tsconfig.json
├── docker-compose.yml           ← Postgres + Redis + Redis Commander
├── vercel.json                  ← cron schedule
│
├── agents/                      ← perfis especialistas (ver acima)
│   ├── ux-ui-designer.md
│   ├── fullstack-developer.md
│   ├── ai-automation-specialist.md
│   ├── qa-specialist.md
│   ├── cybersecurity-specialist.md
│   └── data-science-specialist.md
│
├── prisma/
│   ├── schema.prisma            ← schema completo do banco
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← HOME
│   │   ├── busca/page.tsx       ← resultado IA
│   │   ├── filme/[slug]/page.tsx
│   │   ├── serie/[slug]/page.tsx
│   │   ├── ator/[slug]/page.tsx
│   │   ├── watchlist/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── search/route.ts
│   │       ├── watchlist/route.ts
│   │       ├── watchlist/[id]/route.ts
│   │       └── webhooks/cron/route.ts
│   ├── components/
│   │   ├── layout/{Navbar,Footer}.tsx
│   │   ├── home/{HeroSearch,FeaturedCard,TitleGrid}.tsx
│   │   ├── search/{ChatPanel,ResultCard,RefineChips}.tsx
│   │   ├── title/{TitleHero,TitleRatings,TitleCast,TitleWhere,TitleTrivia,AiOpinion,RelatedTitles}.tsx
│   │   └── ui/{Button,Badge,WatchlistButton,StreamingBadge}.tsx
│   ├── lib/
│   │   ├── db.ts                ← Prisma singleton
│   │   ├── auth.ts              ← NextAuth config
│   │   ├── redis.ts             ← Upstash client
│   │   ├── ai/
│   │   │   ├── search.ts        ← Prisma.sql parametrizado + embeddings
│   │   │   ├── enricher.ts      ← Claude Haiku + OpenAI
│   │   │   └── prompts.ts       ← todos os prompts centralizados
│   │   ├── apis/{tmdb,omdb,youtube}.ts
│   │   └── seo/generator.ts
│   ├── pipeline/
│   │   ├── index.ts             ← worker entrypoint
│   │   ├── queues.ts
│   │   ├── jobs/{ingest-title,enrich-title,sync-availability,sync-ratings}.ts
│   │   └── scripts/{seed-top-titles,seed-trending,run-job}.ts
│   └── types/{title,search,api}.ts
│
├── scripts/
│   ├── setup-local.sh           ← setup automático (mock por padrão, --real opcional)
│   ├── seed-platforms.ts        ← Netflix, Prime, Max, Disney+, etc.
│   ├── seed-mock.ts             ← 10 títulos sem chamar APIs
│   ├── test-pipeline.ts
│   ├── test-search.ts
│   └── init-db.sql              ← extensions pgvector/pg_trgm/unaccent
│
└── docs/                        ← stubs, precisam ser preenchidos
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── PIPELINE.md
    ├── API.md
    └── SETUP.md
```

---

## Regras de desenvolvimento (não negociáveis)

1. **Nunca** buscar dados em API externa durante uma request do usuário se já podiam estar no banco.
2. **Sempre** usar ISR (`revalidate`) nas páginas de título — não SSR puro, exceto quando depender de sessão.
3. **Nunca** expor chaves de API no cliente. Server Components / API Routes only.
4. **Sempre** validar input do usuário com Zod antes de tocar no banco.
5. **Sempre** usar `prisma.$transaction` para operações múltiplas relacionadas.
6. **Cache Redis** em toda resposta da busca IA (TTL 1h por query).
7. **Rate limit** em endpoints públicos. Por `userId` quando autenticado, pelo primeiro IP de `X-Forwarded-For` quando anônimo.
8. **LGPD** — nunca logar PII (email, IP, nome) em plain text.
9. **SQL raw** só com `Prisma.sql` parametrizado. `$queryRawUnsafe` é proibido em código novo.
10. **Prompts** vivem em `src/lib/ai/prompts.ts` — nunca inline em outro arquivo.
11. **Workers BullMQ** são idempotentes. Rodar 2x o mesmo job não pode duplicar dado.

---

## Setup local (comando único)

```bash
bash scripts/setup-local.sh           # dados mockados (default)
bash scripts/setup-local.sh --real    # dados reais (exige chaves no .env.local)
```

O script:
1. Verifica Node/Docker/npm
2. `npm install`
3. Cria `.env.local` a partir de `.env.example` (se não existir)
4. Cria/atualiza `.env` com `DATABASE_URL` (Prisma CLI precisa)
5. `docker compose up -d`
6. Aguarda Postgres
7. `prisma generate` + `prisma migrate dev`
8. `seed-platforms`
9. `seed-mock` (ou `seed-top-titles` no modo `--real`)

Depois: `npm run dev` → http://localhost:3002

Prisma Studio para inspeção: `npm run prisma:studio`.

---

## Ordem de evolução do projeto

```
Fase 1 — Fundação  ✅ concluída
Fase 2 — Frontend  ✅ páginas básicas prontas (faltam polimento visual + microinterações)
Fase 3 — Crons     ✅ cron endpoint + jobs prontos; falta autenticar monitoring
Fase 4 — SEO       🚧 generateMetadata parcial; falta sitemap dinâmico e schema.org completo
Fase 5 — Qualidade 🚧 sem testes; falta CI; falta monitoramento
Fase 6 — LGPD      🚧 consentimento parcial; faltam endpoints de export/delete
Fase 7 — Rerank    📋 planejado — híbrido vector + popularidade + personalização leve
```

---

## Convenção de commits e PRs

- Commits em imperativo e português: "Corrige X", "Adiciona Y", "Atualiza Z".
- Commit que toca CLAUDE.md obrigatório quando:
  - Status de Fase muda
  - Decisão de arquitetura foi tomada (mover coisa entre camadas, trocar libs)
  - Feature ou rota nova entra
  - Segurança é afetada
  - Risco ou débito técnico é descoberto (registre em "Em aberto")

- PR nunca mistura tipos diferentes (ex.: fix + refactor + feature num só).
- Todo PR tem: o que mudou, por que, como testar.
