#!/usr/bin/env bash
# scripts/setup-local.sh — Setup local completo
# Uso:
#   bash scripts/setup-local.sh          → seed com dados mockados (padrão)
#   bash scripts/setup-local.sh --real   → seed com dados reais (exige chaves de API)
set -e

SEED_MODE="mock"
if [[ "$*" == *"--real"* ]]; then
  SEED_MODE="real"
fi

echo ""
echo "╔══════════════════════════════════╗"
echo "║   Rebobina.ai — Setup Local      ║"
echo "╚══════════════════════════════════╝"
echo ""

# ── 1. Pré-requisitos ────────────────────────────────────────────
echo "→ Verificando pré-requisitos..."
command -v node   >/dev/null 2>&1 || { echo "× Node.js 20+ não encontrado" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "× Docker não encontrado" >&2; exit 1; }
command -v npm    >/dev/null 2>&1 || { echo "× npm não encontrado" >&2; exit 1; }
echo "  ✓ Node, Docker e npm OK"

# ── 2. Dependências ─────────────────────────────────────────────
if [ ! -d node_modules ]; then
  echo "→ Instalando dependências..."
  npm install
else
  echo "→ node_modules já existe, pulando npm install"
fi

# ── 3. Arquivos de ambiente ──────────────────────────────────────
# .env.local → lido pelo Next.js (dev server)
if [ ! -f .env.local ]; then
  echo "→ Criando .env.local..."
  cp .env.example .env.local
  echo "  ✓ .env.local criado (edite com suas chaves de API para modo --real)"
else
  echo "→ .env.local já existe, mantendo"
fi

# .env → lido pelo Prisma CLI (migrate, studio, generate)
# Sempre sobrescreve só o DATABASE_URL para manter em sync com .env.local
DB_URL=$(grep '^DATABASE_URL=' .env.local | head -1 | cut -d '=' -f2-)
if [ -n "$DB_URL" ]; then
  echo "DATABASE_URL=$DB_URL" > .env
  echo "→ .env criado/atualizado para o Prisma CLI"
else
  if [ ! -f .env ]; then
    echo 'DATABASE_URL="postgresql://rebobina:senha123@localhost:5433/rebobina_dev?schema=public"' > .env
    echo "→ .env criado com DATABASE_URL padrão"
  fi
fi

# ── 4. Infra (Postgres + Redis) ──────────────────────────────────
echo "→ Subindo containers Docker..."
docker compose up -d

# ── 5. Aguarda Postgres ──────────────────────────────────────────
echo "→ Aguardando Postgres ficar pronto..."
for i in $(seq 1 30); do
  if docker exec rebobina_postgres pg_isready -U rebobina >/dev/null 2>&1; then
    echo "  ✓ Postgres pronto (${i}s)"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "× Postgres não respondeu em 30s. Verifique: docker logs rebobina_postgres"
    exit 1
  fi
  sleep 1
done

# ── 6. Prisma ────────────────────────────────────────────────────
echo "→ Gerando Prisma Client..."
npx prisma generate

echo "→ Rodando migrations..."
npx prisma migrate dev --name init

# ── 7. Seed de plataformas ───────────────────────────────────────
echo "→ Populando plataformas de streaming BR..."
npx tsx scripts/seed-platforms.ts

# ── 8. Seed de títulos ───────────────────────────────────────────
if [ "$SEED_MODE" = "mock" ]; then
  echo "→ Populando banco com dados mockados (10 títulos)..."
  npx tsx scripts/seed-mock.ts
else
  echo "→ Populando banco com dados reais (TMDB + Claude + OpenAI)..."
  echo "  ⚠  Isso exige chaves válidas no .env.local e leva ~15 min para 50 títulos"
  npx tsx src/pipeline/scripts/seed-top-titles.ts --limit 50
fi

# ── Pronto ───────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✓ Setup completo!                          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
if [ "$SEED_MODE" = "mock" ]; then
  echo "  Dados: mockados (UI funciona, busca IA não)"
  echo "  Para dados reais depois: bash scripts/setup-local.sh --real"
else
  echo "  Dados: reais (TMDB + IA)"
fi
echo ""
echo "  Inicie o app:   npm run dev"
echo "  Abra:           http://localhost:3002"
echo "  Banco (visual): npm run prisma:studio"
echo ""
