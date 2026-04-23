// scripts/seed-platforms.ts
// Popula plataformas de streaming BR

import { prisma } from '../src/lib/db'

const platforms = [
  { name: 'Netflix',      slug: 'netflix',       colorHex: '#E50914', tmdbProviderId: 8,   baseUrlBr: 'https://www.netflix.com/br/',        hasAffiliate: false },
  { name: 'Prime Video',  slug: 'prime-video',   colorHex: '#00A8E0', tmdbProviderId: 119, baseUrlBr: 'https://www.primevideo.com/',        hasAffiliate: true  },
  { name: 'Max',          slug: 'max',           colorHex: '#002BE7', tmdbProviderId: 1899,baseUrlBr: 'https://www.max.com/br/',            hasAffiliate: false },
  { name: 'Disney+',      slug: 'disney-plus',   colorHex: '#113CCF', tmdbProviderId: 337, baseUrlBr: 'https://www.disneyplus.com/',        hasAffiliate: false },
  { name: 'Globoplay',    slug: 'globoplay',     colorHex: '#FF6B00', tmdbProviderId: 307, baseUrlBr: 'https://globoplay.globo.com/',       hasAffiliate: false },
  { name: 'Apple TV+',    slug: 'apple-tv-plus', colorHex: '#555555', tmdbProviderId: 350, baseUrlBr: 'https://tv.apple.com/br/',           hasAffiliate: false },
  { name: 'Paramount+',   slug: 'paramount-plus',colorHex: '#0064FF', tmdbProviderId: 531, baseUrlBr: 'https://www.paramountplus.com/br/',  hasAffiliate: false },
  { name: 'Claro TV+',    slug: 'claro-tv-plus', colorHex: '#FF0000', tmdbProviderId: 283, baseUrlBr: 'https://clarotvmais.claro.com.br/',  hasAffiliate: false },
  { name: 'MUBI',         slug: 'mubi',          colorHex: '#000000', tmdbProviderId: 11,  baseUrlBr: 'https://mubi.com/pt/br/',            hasAffiliate: true  },
  { name: 'Telecine',     slug: 'telecine',      colorHex: '#1A1A6E', tmdbProviderId: 227, baseUrlBr: 'https://telecine.com.br/',           hasAffiliate: false },
  { name: 'Crunchyroll',  slug: 'crunchyroll',   colorHex: '#F47521', tmdbProviderId: 1968,baseUrlBr: 'https://www.crunchyroll.com/pt-br/', hasAffiliate: false },
]

async function main() {
  for (const p of platforms) {
    await prisma.platform.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    })
  }
  console.log(`✓ ${platforms.length} plataformas criadas/atualizadas`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
