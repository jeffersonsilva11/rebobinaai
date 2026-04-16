#!/usr/bin/env bash
# scripts/setup-local.sh — Setup local completo
set -e

echo "→ Rebobina.ai — Setup Local"
echo "────────────────────────────"

# 1. Verifica pré-requisitos
command -v node >/dev/null 2>&1 || { echo "× Node.js 20+ não encontrado" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "× Docker não encontrado" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "× npm não encontrado" >&2; exit 1; }

# 2. Instala dependências
if [ ! -d node_modules ]; then
  echo "→ Instalando dependências..."
  npm install
fi

# 3. Configura .env.local
if [ ! -f .env.local ]; then
  echo "→ Criando .env.local (edite com suas chaves)"
  cp .env.example .env.local
  echo "⚠  Edite .env.local com suas chaves de API antes de continuar"
fi

# 4. Sobe infra (Postgres + Redis)
echo "→ Subindo containers..."
docker-compose up -d

# 5. Espera Postgres ficar pronto
echo "→ Aguardando Postgres..."
for i in $(seq 1 30); do
  if docker exec rebobina_postgres pg_isready -U rebobina >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# 6. Gera Prisma client + roda migrations
echo "→ Prisma generate + migrate..."
npx prisma generate
npx prisma migrate dev --name init

# 7. Popula plataformas
echo "→ Populando plataformas BR..."
npx tsx scripts/seed-platforms.ts

echo ""
echo "✓ Setup completo!"
echo ""
echo "Próximos passos:"
echo "  1. Popule títulos:  npx tsx scripts/test-pipeline.ts"
echo "  2. Rode o site:     npm run dev"
echo "  3. Abra:            http://localhost:3000"
