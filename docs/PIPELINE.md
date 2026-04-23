# PIPELINE — Rebobina.ai

Pipeline de ingestão e enriquecimento de títulos.

> Tudo que aparece no site foi **pré-processado** pelo pipeline.
> Nenhuma chamada a API externa acontece no caminho do usuário.

---

## Fluxo de um título

```
 seed script ──▶ ingestTitle({ tmdbId }) ──▶ enrichTitle({ titleId })
                      │                              │
                      ▼                              ▼
                 TMDB + OMDb +                  Claude Haiku
                 YouTube (trailer)              + OpenAI embedding
                      │                              │
                      ▼                              ▼
            upsert Title + Rating           UPDATE titles SET
            + Genre + Cast                  synopsis_pt, ai_*,
            + Availability                  embedding, schema_org,
                                            status='PUBLISHED'
```

---

## Jobs

### `ingest-title.ts` (`src/pipeline/jobs/ingest-title.ts`)

Entrada: `{ tmdbId: number, type: 'MOVIE' | 'SERIES' }`.

1. Busca dados base em TMDB (`getMovie` / `getSeries`)
2. Gera slug (`slugify(title)` + ano)
3. Em paralelo: OMDb (notas), credits (elenco), external_ids (IMDb, TVDB),
   watch/providers (onde assistir), videos (trailer YouTube)
4. `upsert Title` com dados brutos (status=`DRAFT`)
5. Sincroniza filhos: `Rating`, `Genre`, `TitleCast`, `TitleAvailability`
6. Dispara `enrichTitle({ titleId })` em seguida

**Idempotente:** roda N vezes produz o mesmo resultado.

### `enrich-title.ts` (`src/pipeline/jobs/enrich-title.ts`)

Entrada: `{ titleId: string }`.

1. Carrega título com gêneros, ratings e cast
2. Se `enrichedAt != null`, pula
3. Monta `context` para prompt + texto para embedding
4. Em paralelo:
   - `callClaudeEnricher(context)` — gera `synopsisPt`, `aiTags`, `aiMoodTags`,
     `complexity`, `pace`, `anxietyLevel`, `trivia`, `opinionSummary`,
     `seoMetaTitle`, `seoMetaDesc`, `schemaOrg`
   - `generateEmbedding(text)` — vetor 1536-dim do OpenAI
5. `$executeRaw UPDATE titles SET ... embedding = '[...]'::vector,
   status='PUBLISHED', enriched_at=NOW()`

### `sync-availability.ts` (cron diário)

Para cada `Title PUBLISHED`:
1. `tmdb.getWatchProviders(tmdbId, 'BR')`
2. Marca `TitleAvailability.isActive = false` para tudo que sumiu
3. Faz upsert do que veio novo

**Por que não re-enriquecer?** Porque o que muda é volátil; o que foi
enriquecido (tags, curiosidades, sinopse) não depende de onde está disponível.

### `sync-ratings.ts` (cron semanal)

Re-consulta OMDb para títulos populares e atualiza `Rating`.

---

## Filas BullMQ

Em `src/pipeline/queues.ts`:

- `ingestQueue` — concurrency 3 (limita rate dos providers)
- `enrichQueue` — concurrency 5 (IA é caro, não queremos paralelismo demais)
- `availabilityQueue` — concurrency 10
- `ratingsQueue` — concurrency 5

Todas com retry exponencial (5 tentativas, backoff 2^n minutos).

---

## Scripts CLI

```bash
# Popula plataformas BR iniciais
npx tsx scripts/seed-platforms.ts

# Popula N títulos top (usa lista curada em seed-top-titles.ts)
npx tsx src/pipeline/scripts/seed-top-titles.ts

# Popula trending semanal (TMDB)
npx tsx src/pipeline/scripts/seed-trending.ts

# Roda job avulso
npx tsx src/pipeline/scripts/run-job.ts ingest 603    # Matrix tmdbId=603

# Teste end-to-end (pipeline completo com 5 títulos)
npx tsx scripts/test-pipeline.ts
```

---

## Crons (Vercel)

Declarados em `vercel.json` → apontam para `POST /api/webhooks/cron`:

```json
{
  "crons": [
    { "path": "/api/webhooks/cron?job=availability", "schedule": "0 3 * * *"   },
    { "path": "/api/webhooks/cron?job=new-titles",   "schedule": "0 4 * * *"   },
    { "path": "/api/webhooks/cron?job=ratings",      "schedule": "0 5 * * 1"   },
    { "path": "/api/webhooks/cron?job=snapshot",     "schedule": "0 6 * * 0"   }
  ]
}
```

Autenticação via `Authorization: Bearer ${CRON_SECRET}`.

---

## Monitoramento

- Cada job loga `[ingest]`, `[enrich]`, `[availability]` no stdout
- BullMQ retries ficam na queue, visíveis via `queueEvents.on('failed', …)`
- Erros de IA com parse JSON são capturados e logados com `text.slice(0, 200)`

---

## Custos estimados (por 1.000 títulos)

| Operação | Custo |
|----------|-------|
| Claude Haiku enrich (1.5k tokens in + 1k out) | ~$0.30 |
| OpenAI embedding 3-small (8k tokens) | ~$0.002 |
| TMDB / OMDb / YouTube | gratuito |
| **Total / 1.000 títulos** | **~$0.50** |

Muito barato. A limitação real é rate limit de TMDB (40 req/s) e OMDb (1.000/dia grátis).
