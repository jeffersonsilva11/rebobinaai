# API — Rebobina.ai

Referência das rotas públicas e privadas do Next.js App Router.

Todas as rotas em `src/app/api/**/route.ts`.

---

## `POST /api/search`

Busca por linguagem natural com IA.

### Request

```http
POST /api/search
Content-Type: application/json

{
  "query": "algo feel-good e tranquilo pra dormir",
  "typeFilter": "MOVIE" | "SERIES" | "ALL",   // opcional, default ALL
  "platformFilter": [1, 4],                    // opcional, IDs de Platform
  "page": 1                                    // opcional
}
```

Validado por Zod (`src/app/api/search/route.ts`).

### Response 200

```json
{
  "query": "…",
  "intent": {
    "type": "ALL",
    "moodTags": ["feel-good", "cozy"],
    "maxAnxietyLevel": 2,
    "safeFor": ["before_sleep"],
    "summary": "filme leve para relaxar antes de dormir"
  },
  "results": [
    {
      "id": "cuid",
      "slug": "paddington-2-2017",
      "title_pt": "Paddington 2",
      "year": 2017,
      "type": "MOVIE",
      "poster_url": "https://…",
      "matchScore": 94,
      "aiReason": "Garante bom humor",
      "ai_mood_tags": ["feel-good", "cozy", "wholesome"],
      "ai_anxiety_level": 1,
      "availability": [
        {
          "platformName": "Netflix",
          "colorHex": "#E50914",
          "accessType": "SUBSCRIPTION",
          "deeplinkUrl": "https://…"
        }
      ]
    }
  ],
  "total": 8,
  "sessionId": "uuid"
}
```

### Errors

| Status | Quando |
|--------|--------|
| 400 | Query inválida (< 2 ou > 500 chars) |
| 429 | Rate limit (20 req/min/IP) |
| 500 | Erro interno (IA timeout, DB down) |

### Cache

Resposta é cacheada no Redis por **1 hora** por `(query, typeFilter, platformFilter)`.

---

## `GET /api/watchlist`

Lista a watchlist do usuário logado.

### Auth

Requer sessão NextAuth. Retorna 401 se não logado.

### Response 200

```json
{
  "items": [
    {
      "id": "cuid",
      "userId": "…",
      "titleId": "…",
      "status": "WANT",
      "userRating": null,
      "userReview": null,
      "notifyAvailable": false,
      "addedAt": "2026-04-16T12:00:00Z",
      "watchedAt": null,
      "title": { "id": "…", "slug": "…", "titlePt": "…", "posterUrl": "…", ... }
    }
  ]
}
```

---

## `POST /api/watchlist`

Adiciona título à watchlist.

### Request

```json
{
  "titleId": "cuid",
  "status": "WANT" | "WATCHING" | "WATCHED",   // default WANT
  "notifyAvailable": false
}
```

### Response 201

```json
{ "ok": true, "item": { ... } }
```

Se o item já existir, retorna 409.

---

## `PATCH /api/watchlist/[id]`

Atualiza item. Body parcial:

```json
{
  "status": "WATCHED",
  "userRating": 5,
  "userReview": "…",
  "notifyAvailable": true,
  "watchedAt": "2026-04-16T00:00:00Z"
}
```

Retorna 200 com item atualizado, ou 404 se não pertence ao usuário.

---

## `DELETE /api/watchlist/[id]`

Remove item. Retorna 204 se ok, 404 se não existe / não é do usuário.

---

## `POST /api/webhooks/cron`

Endpoint para Vercel Cron. Requer `Authorization: Bearer ${CRON_SECRET}`.

### Query params

- `?job=availability` — roda `sync-availability`
- `?job=new-titles` — busca trending e ingere
- `?job=ratings` — atualiza notas
- `?job=snapshot` — gera behavior snapshots semanais

### Response

```json
{ "ok": true, "job": "availability", "processed": 142, "failed": 3 }
```

---

## `GET /api/auth/[...nextauth]`

Handler do NextAuth. Configurado em `src/lib/auth.ts`:
- Provider: Google OAuth
- Adapter: Prisma
- Session strategy: database

Rotas auxiliares do NextAuth (`/signin`, `/signout`, `/session`, `/csrf`) são
expostas automaticamente.

---

## Rate limiting

Implementado via Redis INCR + EXPIRE, chave por IP.

| Rota | Limite |
|------|--------|
| `POST /api/search` | 20 req/min |

Outras rotas podem adicionar rate limiting conforme necessário.

---

## Erros comuns

Todas as respostas de erro seguem:

```ts
// src/types/api.ts
interface ApiError {
  error: string       // mensagem user-friendly em PT-BR
  details?: string    // stack/detalhe — só em dev
}
```

Em produção `details` é omitido.

---

## CORS

Por padrão, Next.js não habilita CORS. As rotas aqui são **first-party only**
— consumidas apenas pelo próprio frontend. Se precisarmos abrir API pública
no futuro (fase 4), adicionaremos headers + API keys.
