# REBOBINA.AI — Instruções para Claude Code
## Leia este arquivo PRIMEIRO antes de qualquer coisa

---

## Contexto do projeto

Meta-streaming brasileiro com IA de recomendação por linguagem natural.
O usuário escreve "série curta sem ansiedade" e a IA retorna resultados com
% de match, onde assistir no Brasil, e deeplinks diretos para os streamings.

**Filosofia central:** banco inteligente, frontend burro.
Nada é processado na hora da requisição se já pode estar no banco.

---

## O que implementar (na ordem)

### FASE 1 — Infraestrutura (comece aqui)

**1.1 — Setup do projeto Next.js**
```bash
npx create-next-app@latest rebobina --typescript --tailwind --app --src-dir --import-alias "@/*"
cd rebobina
npm install @prisma/client prisma @anthropic-ai/sdk openai next-auth @auth/prisma-adapter zod ioredis bullmq @upstash/redis
npm install -D tsx
```

**1.2 — Copie o schema**
- Arquivo `schema.prisma` → copie para `prisma/schema.prisma`
- Crie o `docker-compose.yml` com PostgreSQL+pgvector e Redis
- Crie `scripts/init-db.sql` com as extensões
- Rode: `docker-compose up -d && npx prisma migrate dev --name init`

**1.3 — Crie os arquivos de lib**

`src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
declare global { var prisma: PrismaClient | undefined }
export const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
```

`src/lib/redis.ts`:
```typescript
import { Redis } from '@upstash/redis'
// Para local, use ioredis diretamente
import { createClient } from 'redis'
export const redis = createClient({ url: process.env.REDIS_URL })
```

**1.4 — NextAuth com Google**

`src/lib/auth.ts` — configure NextAuth com:
- GoogleProvider com CLIENT_ID e CLIENT_SECRET
- PrismaAdapter(prisma)
- callbacks: session deve incluir user.id

`src/app/api/auth/[...nextauth]/route.ts` — export handler

**1.5 — TMDB API Client**

`src/lib/apis/tmdb.ts` — implemente:
- `getMovie(id)` → dados completos do filme
- `getSeries(id)` → dados completos da série
- `getCredits(id, type)` → elenco + equipe
- `getExternalIds(id, type)` → redes sociais
- `getWatchProviders(id, type, country)` → onde assistir
- `getVideos(id, type)` → trailers
- `getTrending(type, window)` → trending semanal
- `getNowPlaying()` → em cartaz
- `getOnAir()` → séries em exibição

Base URL: `https://api.themoviedb.org/3`
Auth: `Authorization: Bearer ${TMDB_READ_TOKEN}`

---

### FASE 2 — Pipeline de dados

**2.1 — Seed de plataformas**
Crie `scripts/seed-platforms.ts` com as 11 plataformas BR
(dados no arquivo `config-files.ts` deste projeto)

**2.2 — Ingest de título**
Copie `ingest-title.ts` para `src/pipeline/jobs/ingest-title.ts`
Ajuste imports para seu projeto

**2.3 — Enriquecimento IA**
Copie `enrich-title.ts` para `src/pipeline/jobs/enrich-title.ts`

**ATENÇÃO no enrich:** o campo `embedding` usa SQL raw com pgvector:
```sql
UPDATE titles SET embedding = $1::vector WHERE id = $2
```
O Prisma não suporta o tipo vector nativamente, use `$executeRaw`.

**2.4 — Script de teste**
Crie `scripts/test-pipeline.ts`:
```typescript
import { ingestTitle } from '../src/pipeline/jobs/ingest-title'

// 5 títulos para testar tudo
const titles = [
  { tmdbId: 238,   type: 'MOVIE'  as const }, // O Poderoso Chefão
  { tmdbId: 27205, type: 'MOVIE'  as const }, // A Origem
  { tmdbId: 550,   type: 'MOVIE'  as const }, // Clube da Luta
  { tmdbId: 1396,  type: 'SERIES' as const }, // Breaking Bad
  { tmdbId: 66732, type: 'SERIES' as const }, // Stranger Things
]

async function main() {
  for (const t of titles) {
    console.log(`Ingerindo ${t.tmdbId}...`)
    await ingestTitle(t)
    await new Promise(r => setTimeout(r, 2000))
  }
  console.log('✓ Pipeline testado com sucesso')
}
main()
```

---

### FASE 3 — API de busca

Copie `search-route.ts` para `src/app/api/search/route.ts`

**ATENÇÃO na busca vetorial:** use `$queryRawUnsafe` com cuidado.
O operador `<=>` é do pgvector (distância cosseno).
Certifique que o índice `ivfflat` está criado:
```sql
CREATE INDEX ON titles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```
Adicione isso ao `init-db.sql`.

---

### FASE 4 — Watchlist API

`src/app/api/watchlist/route.ts`:
- GET: retorna watchlist do usuário autenticado
- POST: adiciona título à watchlist

`src/app/api/watchlist/[id]/route.ts`:
- PATCH: atualiza status (want/watching/watched) e rating
- DELETE: remove da watchlist

Sempre verificar sessão com `getServerSession(authOptions)`.
Retornar 401 se não autenticado.

---

### FASE 5 — Páginas (3 páginas obrigatórias)

**5.1 — HOME (`src/app/page.tsx`)**

Deve ter:
- Campo de busca central grande com placeholder "O que você quer assistir hoje?"
- Ao submeter, redireciona para `/busca?q=texto`
- Grid de cards com títulos em alta (busca no banco: published, orderBy pageViews)
- Card destaque editorial (título com maior imdb_score da semana)
- Barra com logos dos streamings
- Chips de sugestão de busca clicáveis

Use ISR: `export const revalidate = 3600` (1 hora)

**5.2 — BUSCA (`src/app/busca/page.tsx`)**

Layout split:
- Esquerda (340px): painel de chat com histórico da conversa
- Direita: resultados com cards

Cada card de resultado deve ter:
- Poster (next/image do TMDB)
- Título + ano + tipo
- Match score (% calculado)
- Motivo da IA (aiReason)
- Notas IMDb + RT
- Plataformas disponíveis com dots coloridos
- Botões: "Assistir" (deeplink) + "Watchlist" (requer auth)

O campo de busca chama POST /api/search
Deve mostrar estado de loading enquanto busca

**5.3 — FILME (`src/app/filme/[slug]/page.tsx`)**

Layout:
- Backdrop fullscreen com gradiente
- Poster + informações do hero
- Notas (IMDb, RT, Metacritic)
- Trailer embed YouTube
- Sinopse
- AI Opinion com sentiment bars
- Onde assistir no Brasil (sidebar) com deeplinks
- Elenco em grid
- Curiosidades da IA
- Títulos relacionados

Use `generateMetadata` para SEO:
```typescript
export async function generateMetadata({ params }) {
  const title = await getTitleBySlug(params.slug)
  return {
    title: title.seoMetaTitle,
    description: title.seoMetaDesc,
    openGraph: { images: [title.backdropUrl] },
  }
}
```

Use ISR: `export const revalidate = 86400` (1 dia)
Use `generateStaticParams` para pré-renderizar os 1000 mais populares.

---

### FASE 6 — Cron Jobs

Copie `cron-route.ts` para `src/app/api/webhooks/cron/route.ts`
Crie `vercel.json` com a config dos 4 crons (ver comentário no arquivo)

---

## Regras de segurança obrigatórias

1. **Nunca** exponha chaves de API no cliente (só server components e API routes)
2. **Sempre** valide com Zod antes de queries no banco
3. **Sempre** verifique autenticação nas rotas protegidas (watchlist)
4. **Nunca** use `$queryRawUnsafe` com input do usuário direto
   - No search, o embedding vem da IA (seguro), não do usuário
5. O `CRON_SECRET` deve ser verificado em toda rota de cron
6. Use `getServerSession` (server-side), nunca `useSession` em server components

---

## Queries Prisma importantes

```typescript
// Busca título com tudo para a página do filme
const title = await prisma.title.findUnique({
  where: { slug, status: 'PUBLISHED' },
  include: {
    genres: { include: { genre: true } },
    ratings: true,
    cast: {
      include: { person: true },
      orderBy: { order: 'asc' },
      where: { role: { in: ['ACTOR', 'DIRECTOR', 'WRITER'] } },
    },
    awards: { orderBy: { year: 'desc' } },
    availability: {
      where: { country: 'BR', isActive: true },
      include: { platform: true },
      orderBy: { accessType: 'asc' },
    },
  },
})

// Watchlist do usuário
const watchlist = await prisma.watchlistItem.findMany({
  where: { userId: session.user.id },
  include: {
    title: {
      include: {
        ratings: true,
        availability: {
          where: { country: 'BR', isActive: true },
          include: { platform: true },
          take: 2,
        },
      },
    },
  },
  orderBy: { addedAt: 'desc' },
})
```

---

## Como testar que está tudo funcionando

```bash
# 1. Infra rodando
docker-compose ps

# 2. Banco com dados
npx prisma studio  # http://localhost:5555

# 3. Pipeline com 5 títulos
npx tsx scripts/test-pipeline.ts

# 4. Busca funcionando
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "série curta sem ansiedade"}'

# 5. Site rodando
npm run dev  # http://localhost:3000
```

---

## O que NÃO implementar ainda (fase 2)

- Página de ator (/ator/[slug])
- Página de série (/serie/[slug])  
- Sistema de reviews dos usuários
- Newsletter
- Dashboard de analytics
- API para terceiros (B2B)
- Cloudflare R2 para imagens (use TMDB CDN por ora)
- Plano premium / pagamento
