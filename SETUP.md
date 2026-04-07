# SETUP LOCAL — Rebobina.ai
## Do zero ao funcionando em ~30 minutos

---

## Pré-requisitos

- Node.js 20+
- Docker Desktop (para PostgreSQL + Redis)
- Contas nas APIs (tudo gratuito para começar)

---

## 1. Crie as contas e chaves de API

### TMDB (obrigatório — dados de filmes)
1. Acesse themoviedb.org/signup
2. Vá em Configurações → API
3. Solicite chave (tipo: Developer)
4. Copie a **API Key** e o **Read Access Token**

### Google OAuth (obrigatório — login)
1. Acesse console.cloud.google.com
2. Crie um projeto: "Rebobina"
3. Vá em APIs & Services → OAuth consent screen → External
4. Vá em Credentials → Create → OAuth 2.0 Client ID
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copie **Client ID** e **Client Secret**

### OMDb (opcional — notas adicionais)
1. Acesse omdbapi.com/apikey.aspx
2. Plano gratuito: 1000 req/dia
3. Copie a chave do email

### YouTube Data API v3 (opcional — trailers)
1. No mesmo projeto Google do OAuth
2. Vá em APIs & Services → Enable APIs
3. Busque "YouTube Data API v3" → Enable
4. Vá em Credentials → Create → API Key
5. Copie a chave

### Anthropic (Claude — enriquecimento IA)
1. Acesse console.anthropic.com
2. API Keys → Create Key
3. Copie (começa com sk-ant-)

### OpenAI (embeddings — busca semântica)
1. Acesse platform.openai.com
2. API Keys → Create new secret key
3. Copie (começa com sk-)

---

## 2. Clone e instale o projeto

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/rebobina
cd rebobina

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves
```

---

## 3. Suba a infraestrutura local

```bash
# Sobe PostgreSQL 16 (com pgvector) + Redis
docker-compose up -d

# Verifique se estão rodando
docker-compose ps
# Deve mostrar: rebobina_postgres (healthy) e rebobina_redis (healthy)
```

---

## 4. Configure o banco de dados

```bash
# Gera o cliente Prisma
npx prisma generate

# Roda as migrations (cria todas as tabelas)
npx prisma migrate dev --name init

# Popula plataformas de streaming (seed obrigatório)
npx tsx scripts/seed-platforms.ts

# Verifica se está tudo certo
npx prisma studio
# Abre http://localhost:5555 — interface visual do banco
```

---

## 5. Popula o banco com os primeiros títulos

```bash
# Testa o pipeline com 5 títulos (rápido, ~2 min)
npx tsx scripts/test-pipeline.ts

# Popula com top 50 títulos populares (~15 min)
npx tsx scripts/seed-top-titles.ts --limit 50

# Popula o catálogo completo em background (~2h)
npx tsx scripts/seed-top-titles.ts --limit 500 &

# Acompanhe o progresso
npx tsx scripts/seed-top-titles.ts --status
```

---

## 6. Rode o site

```bash
# Inicia o servidor de desenvolvimento
npm run dev

# Acesse:
# http://localhost:3000          — Home
# http://localhost:3000/busca    — Busca com IA
# http://localhost:3000/filme/[slug] — Página do filme
```

---

## 7. Teste os crons localmente

```bash
# Simula o cron de disponibilidade
curl -H "Authorization: Bearer seu-cron-secret" \
  "http://localhost:3000/api/webhooks/cron?job=availability"

# Simula busca de novos títulos
curl -H "Authorization: Bearer seu-cron-secret" \
  "http://localhost:3000/api/webhooks/cron?job=new-titles"
```

---

## Estrutura de arquivos que você precisa criar

```
Depois do setup, o Claude Code deve criar:

rebobina/
├── .env.local                    ← suas chaves (nunca commitar)
├── .env.example                  ← template (commitar)
├── docker-compose.yml            ← infra local
├── vercel.json                   ← cron config
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
│
├── prisma/
│   └── schema.prisma             ← schema completo (já documentado)
│
├── scripts/
│   ├── seed-platforms.ts         ← popula plataformas
│   ├── seed-top-titles.ts        ← popula títulos iniciais
│   ├── test-pipeline.ts          ← testa com 5 títulos
│   └── init-db.sql               ← extensões PostgreSQL
│
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx              ← HOME
    │   ├── busca/page.tsx        ← BUSCA
    │   ├── filme/[slug]/page.tsx ← FILME
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts
    │       ├── search/route.ts
    │       ├── watchlist/route.ts
    │       └── webhooks/cron/route.ts
    ├── components/
    ├── lib/
    │   ├── db.ts
    │   ├── auth.ts
    │   ├── redis.ts
    │   ├── ai/
    │   │   ├── search.ts
    │   │   └── enricher.ts
    │   └── apis/
    │       ├── tmdb.ts
    │       ├── omdb.ts
    │       └── youtube.ts
    └── pipeline/
        └── jobs/
            ├── ingest-title.ts
            ├── enrich-title.ts
            └── sync-availability.ts
```

---

## Comandos úteis do dia a dia

```bash
# Ver logs do banco
docker-compose logs postgres

# Abrir interface visual do banco
npx prisma studio

# Rodar migration após mudar o schema
npx prisma migrate dev --name descricao-da-mudanca

# Testar busca semântica diretamente
npx tsx scripts/test-search.ts "série curta sem ansiedade"

# Ver fila de jobs
npx tsx scripts/queue-status.ts

# Limpar banco e recomeçar (cuidado!)
npx prisma migrate reset
```

---

## Troubleshooting

**"pgvector extension not found"**
```bash
# Certifique que está usando a imagem pgvector/pgvector:pg16
docker-compose down && docker-compose up -d
```

**"GOOGLE_CLIENT_ID is not defined"**
```bash
# Verifique se o arquivo é .env.local (não .env)
ls -la | grep env
```

**"Rate limit exceeded (TMDB)"**
```bash
# TMDB tem limite de ~50 req/s
# Aumente o sleep no pipeline: PIPELINE_SLEEP_MS=200
```

**Banco vazio após seed**
```bash
# Veja os logs do pipeline
npx tsx scripts/seed-top-titles.ts --verbose
```
