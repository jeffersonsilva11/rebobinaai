# DATABASE — Rebobina.ai

Schema Postgres 16 com extensões `vector` (pgvector) e `pg_trgm` (busca textual).

Fonte de verdade: `prisma/schema.prisma`.

---

## Extensões necessárias

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Já aplicadas no `scripts/init-db.sql` quando o container Postgres sobe via
`docker-compose`.

---

## Modelos principais

### `User` / `Account` / `Session`
NextAuth com PrismaAdapter. `User.plan` é enum `FREE | PREMIUM`.

### `Title`
Centro do universo. Campos importantes:

| Campo | Tipo | Uso |
|-------|------|-----|
| `id` | `String` (cuid) | PK |
| `slug` | `String` unique | URL pública (`/filme/{slug}`) |
| `tmdbId`, `imdbId` | `Int` / `String` | Chaves externas |
| `type` | `MOVIE` \| `SERIES` | Controla rota |
| `titleOriginal`, `titlePt` | `String` | Original vs localizado |
| `synopsisPt`, `synopsisAiQuote` | `String` | Gerados pela IA |
| `aiTags[]`, `aiMoodTags[]` | `String[]` | Busca + filtragem |
| `aiAnxietyLevel` | `Int 1–5` | Filtro "tranquilo?" |
| `aiPace`, `aiComplexity` | `String` | Filtros avançados |
| `embedding` | `vector(1536)` | Busca semântica |
| `status` | `DRAFT` \| `PUBLISHED` | Só PUBLISHED aparece no site |
| `enrichedAt` | `DateTime?` | Null = ainda não passou pela IA |
| `seoMetaTitle`, `seoMetaDesc`, `schemaOrg` | — | Pré-gerados |

**Importante:** `embedding` é declarado no Prisma como
`Unsupported("vector(1536)")` — só é escrito via `$executeRaw` com cast
`::vector`.

### `Rating`
1:1 com `Title`. Notas agregadas: `imdbScore`, `imdbVotes`, `rtTomatometer`,
`rtAudienceScore`, `metacriticScore`, `rebobinaAiScore`.

### `Genre` + `TitleGenre`
N:N. Gêneros TMDB + mapeamento PT-BR (`nameEn`, `namePt`).

### `Person` + `TitleCast`
Elenco e crew. `role` é enum `ACTOR | DIRECTOR | WRITER | PRODUCER | OTHER`.
`order` define prioridade para exibição.

### `Platform` + `TitleAvailability`
**Esse é o dado mais volátil.** Refrescado diariamente pelo cron
`sync-availability`.
- `Platform`: Netflix, Prime, Disney+, Max, Globoplay, etc. — inclui
  `colorHex` para badges.
- `TitleAvailability`: `titleId × platformId × country` com `accessType`
  (`SUBSCRIPTION` / `RENT` / `BUY` / `FREE` / `TVOD`), `deeplinkUrl`,
  `isActive`.

### `WatchlistItem`
Única relação user↔título. `status`: `WANT | WATCHING | WATCHED`.
Campos opcionais: `userRating`, `userReview`, `notifyAvailable`.

### `SearchEvent`, `PageView`, `BehaviorSnapshot`
Analytics anônimos. Nunca gravam IP em plain text.

### `SeoPage` / `EditorialList`
Páginas editoriais ("Melhores filmes de sexta") — popular em fase 2.

---

## Índices importantes

```prisma
@@index([status])
@@index([type, status])
@@index([tmdbId])
@@index([slug])
```

E um **índice vetorial HNSW** criado fora do Prisma, via migration SQL:

```sql
CREATE INDEX ON titles
  USING hnsw (embedding vector_cosine_ops);
```

Aplicado em `scripts/init-db.sql` após o `prisma migrate`.

---

## Transações

Sempre que uma operação escreve em 2+ tabelas, use `prisma.$transaction([...])`.
Ex.: `ingestTitle` faz upsert em `Title` + `Rating` + `TitleGenre[]` +
`TitleCast[]` + `TitleAvailability[]` em uma única transação.

---

## Migrations

```bash
# desenvolvimento
npx prisma migrate dev --name <nome>

# produção
npx prisma migrate deploy
```

**Nunca editar migrations já commitadas.** Se precisar corrigir schema,
crie uma nova migration.

---

## Backup / restore

```bash
# Backup
docker exec rebobina_postgres pg_dump -U rebobina rebobina > backup.sql

# Restore
cat backup.sql | docker exec -i rebobina_postgres psql -U rebobina rebobina
```
