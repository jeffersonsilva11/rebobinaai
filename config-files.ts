// package.json
{
  "name": "rebobina",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "pipeline": "tsx src/pipeline/index.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "seed:platforms": "tsx scripts/seed-platforms.ts",
    "seed:titles": "tsx scripts/seed-top-titles.ts",
    "test:pipeline": "tsx scripts/test-pipeline.ts",
    "test:search": "tsx scripts/test-search.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@auth/prisma-adapter": "^2.0.0",
    "@prisma/client": "^5.14.0",
    "@upstash/redis": "^1.31.0",
    "bullmq": "^5.8.0",
    "ioredis": "^5.3.2",
    "next": "14.2.3",
    "next-auth": "^4.24.7",
    "openai": "^4.50.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "prisma": "^5.14.0",
    "tailwindcss": "^3.4.4",
    "tsx": "^4.15.6",
    "typescript": "^5.4.5"
  }
}

// ─────────────────────────────────────────────────────
// next.config.js
// ─────────────────────────────────────────────────────
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Domínios permitidos para next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile photos
      },
    ],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "img-src 'self' https://image.tmdb.org https://lh3.googleusercontent.com data:",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com",
              "frame-src https://www.youtube.com",
              "connect-src 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

// ─────────────────────────────────────────────────────
// vercel.json — Cron jobs em produção
// ─────────────────────────────────────────────────────
// {
//   "crons": [
//     { "path": "/api/webhooks/cron?job=availability", "schedule": "0 3 * * *" },
//     { "path": "/api/webhooks/cron?job=new-titles",   "schedule": "0 4 * * *" },
//     { "path": "/api/webhooks/cron?job=ratings",      "schedule": "0 5 * * 1" },
//     { "path": "/api/webhooks/cron?job=snapshot",     "schedule": "0 6 * * 1" }
//   ]
// }

// ─────────────────────────────────────────────────────
// scripts/init-db.sql — Extensões PostgreSQL
// ─────────────────────────────────────────────────────
// CREATE EXTENSION IF NOT EXISTS vector;
// CREATE EXTENSION IF NOT EXISTS pg_trgm;
// CREATE EXTENSION IF NOT EXISTS unaccent;

// ─────────────────────────────────────────────────────
// scripts/seed-platforms.ts — Popula plataformas BR
// ─────────────────────────────────────────────────────
// import { prisma } from '../src/lib/db'
//
// const platforms = [
//   { name: 'Netflix',      slug: 'netflix',       colorHex: '#E50914', tmdbProviderId: 8,   baseUrlBr: 'https://www.netflix.com/br/', hasAffiliate: false },
//   { name: 'Prime Video',  slug: 'prime-video',   colorHex: '#00A8E0', tmdbProviderId: 119, baseUrlBr: 'https://www.primevideo.com/', hasAffiliate: true  },
//   { name: 'Max',          slug: 'max',           colorHex: '#002BE7', tmdbProviderId: 1899,baseUrlBr: 'https://www.max.com/br/',     hasAffiliate: false },
//   { name: 'Disney+',      slug: 'disney-plus',   colorHex: '#113CCF', tmdbProviderId: 337, baseUrlBr: 'https://www.disneyplus.com/', hasAffiliate: false },
//   { name: 'Globoplay',    slug: 'globoplay',     colorHex: '#FF6B00', tmdbProviderId: 307, baseUrlBr: 'https://globoplay.globo.com/', hasAffiliate: false },
//   { name: 'Apple TV+',    slug: 'apple-tv-plus', colorHex: '#555555', tmdbProviderId: 350, baseUrlBr: 'https://tv.apple.com/br/',    hasAffiliate: false },
//   { name: 'Paramount+',   slug: 'paramount-plus',colorHex: '#0064FF', tmdbProviderId: 531, baseUrlBr: 'https://www.paramountplus.com/br/', hasAffiliate: false },
//   { name: 'Claro TV+',    slug: 'claro-tv-plus', colorHex: '#FF0000', tmdbProviderId: 283, baseUrlBr: 'https://clarotvmais.claro.com.br/', hasAffiliate: false },
//   { name: 'MUBI',         slug: 'mubi',          colorHex: '#000000', tmdbProviderId: 11,  baseUrlBr: 'https://mubi.com/pt/br/',     hasAffiliate: true  },
//   { name: 'Telecine',     slug: 'telecine',      colorHex: '#1A1A6E', tmdbProviderId: 227, baseUrlBr: 'https://telecine.com.br/',    hasAffiliate: false },
//   { name: 'Crunchyroll',  slug: 'crunchyroll',   colorHex: '#F47521', tmdbProviderId: 283, baseUrlBr: 'https://www.crunchyroll.com/pt-br/', hasAffiliate: false },
// ]
//
// async function main() {
//   for (const p of platforms) {
//     await prisma.platform.upsert({
//       where: { slug: p.slug },
//       create: p,
//       update: p,
//     })
//   }
//   console.log('✓ Plataformas criadas')
// }
// main().then(() => process.exit(0))
