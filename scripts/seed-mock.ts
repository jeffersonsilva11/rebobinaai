// scripts/seed-mock.ts
// Popula banco com dados mockados (sem chamar APIs externas).
// Use: npm run seed:mock

import { prisma } from '../src/lib/db'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

const genres = [
  { tmdbId: 28,  nameEn: 'Action',    namePt: 'Ação',       slug: 'acao' },
  { tmdbId: 18,  nameEn: 'Drama',     namePt: 'Drama',      slug: 'drama' },
  { tmdbId: 878, nameEn: 'Sci-Fi',    namePt: 'Ficção Científica', slug: 'ficcao-cientifica' },
  { tmdbId: 53,  nameEn: 'Thriller',  namePt: 'Thriller',   slug: 'thriller' },
  { tmdbId: 35,  nameEn: 'Comedy',    namePt: 'Comédia',    slug: 'comedia' },
  { tmdbId: 80,  nameEn: 'Crime',     namePt: 'Crime',      slug: 'crime' },
  { tmdbId: 10765, nameEn: 'Sci-Fi & Fantasy', namePt: 'Ficção e Fantasia', slug: 'ficcao-fantasia' },
  { tmdbId: 9648, nameEn: 'Mystery',  namePt: 'Mistério',   slug: 'misterio' },
]

const titles = [
  {
    tmdbId: 157336,
    imdbId: 'tt0816692',
    type: 'MOVIE' as const,
    slug: 'interestelar-2014',
    titlePt: 'Interestelar',
    titleOriginal: 'Interstellar',
    year: 2014,
    runtimeMin: 169,
    synopsisPt: 'Quando a Terra se torna inabitável, um grupo de astronautas embarca numa missão além das estrelas em busca de um novo lar para a humanidade. Uma jornada sobre amor, tempo e sobrevivência.',
    synopsisAiQuote: 'O amor é a única força que transcende tempo e espaço.',
    posterUrl: `${TMDB_IMG}/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg`,
    aiMoodTags: ['thought-provoking', 'emotional', 'mind-bending'],
    aiTags: ['space', 'time-travel', 'family', 'science', 'epic'],
    aiComplexity: 'complex',
    aiPace: 'slow',
    aiAnxietyLevel: 3,
    aiBingeWorthy: false,
    aiSafeFor: ['date_night'],
    aiNotGoodFor: ['before_sleep', 'with_kids'],
    imdbScore: 8.7,
    rtTomatometer: 73,
    metacritic: 74,
    genreSlugs: ['drama', 'ficcao-cientifica', 'thriller'],
    platforms: [{ slug: 'netflix', accessType: 'SUBSCRIPTION' as const }, { slug: 'prime-video', accessType: 'RENT' as const }],
  },
  {
    tmdbId: 496243,
    imdbId: 'tt6751668',
    type: 'MOVIE' as const,
    slug: 'parasita-2019',
    titlePt: 'Parasita',
    titleOriginal: 'Parasite',
    year: 2019,
    runtimeMin: 132,
    synopsisPt: 'Toda a família Ki-taek está desempregada e fascinada pela rica família Park. Após uma série de coincidências, eles se infiltram na vida dos ricos — com consequências imprevisíveis.',
    synopsisAiQuote: 'A desigualdade tem um cheiro. E você consegue sentir.',
    posterUrl: `${TMDB_IMG}/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/ApiBzeaa95TNYliSbQ8pJv4Nalp.jpg`,
    aiMoodTags: ['dark', 'tense', 'thought-provoking'],
    aiTags: ['class-divide', 'satire', 'korean', 'oscar-winner', 'suspense'],
    aiComplexity: 'complex',
    aiPace: 'medium',
    aiAnxietyLevel: 4,
    aiBingeWorthy: false,
    aiSafeFor: ['date_night'],
    aiNotGoodFor: ['before_sleep', 'with_kids', 'hangover'],
    imdbScore: 8.5,
    rtTomatometer: 99,
    metacritic: 96,
    genreSlugs: ['drama', 'thriller', 'crime'],
    platforms: [{ slug: 'max', accessType: 'SUBSCRIPTION' as const }],
  },
  {
    tmdbId: 27205,
    imdbId: 'tt1375666',
    type: 'MOVIE' as const,
    slug: 'a-origem-2010',
    titlePt: 'A Origem',
    titleOriginal: 'Inception',
    year: 2010,
    runtimeMin: 148,
    synopsisPt: 'Dom Cobb é um ladrão especializado em extrair segredos do inconsciente. Ele recebe uma missão impossível: plantar uma ideia na mente de alguém. Uma aventura dentro dos sonhos.',
    synopsisAiQuote: 'Você ainda está num sonho. Ou já acordou?',
    posterUrl: `${TMDB_IMG}/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg`,
    aiMoodTags: ['mind-bending', 'tense', 'action-packed'],
    aiTags: ['dreams', 'heist', 'sci-fi', 'christopher-nolan', 'epic'],
    aiComplexity: 'complex',
    aiPace: 'fast',
    aiAnxietyLevel: 3,
    aiBingeWorthy: false,
    aiSafeFor: ['date_night'],
    aiNotGoodFor: ['before_sleep', 'with_kids'],
    imdbScore: 8.8,
    rtTomatometer: 87,
    metacritic: 74,
    genreSlugs: ['acao', 'ficcao-cientifica', 'thriller'],
    platforms: [{ slug: 'netflix', accessType: 'SUBSCRIPTION' as const }, { slug: 'max', accessType: 'SUBSCRIPTION' as const }],
  },
  {
    tmdbId: 429617,
    imdbId: 'tt6320628',
    type: 'MOVIE' as const,
    slug: 'homem-aranha-longe-de-casa-2019',
    titlePt: 'Homem-Aranha: Longe de Casa',
    titleOriginal: 'Spider-Man: Far from Home',
    year: 2019,
    runtimeMin: 129,
    synopsisPt: 'Peter Parker vai a uma viagem escolar pela Europa, mas Nick Fury o recruta para enfrentar criaturas elementais que ameaçam o continente. Uma aventura sobre responsabilidade e identidade.',
    synopsisAiQuote: 'Não há descanso para o Amigo da Vizinhança.',
    posterUrl: `${TMDB_IMG}/fIE3ys3pVUxhZqt4yYJWdXWP9MM.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/6UVDwMpNQFbLzVxBa3mI4w0xBH0.jpg`,
    aiMoodTags: ['funny', 'action-packed', 'uplifting'],
    aiTags: ['marvel', 'superhero', 'teen', 'adventure', 'europe'],
    aiComplexity: 'simple',
    aiPace: 'fast',
    aiAnxietyLevel: 2,
    aiBingeWorthy: false,
    aiSafeFor: ['with_kids', 'date_night'],
    aiNotGoodFor: ['before_sleep'],
    imdbScore: 7.4,
    rtTomatometer: 91,
    metacritic: 69,
    genreSlugs: ['acao', 'ficcao-cientifica'],
    platforms: [{ slug: 'disney-plus', accessType: 'SUBSCRIPTION' as const }],
  },
  {
    tmdbId: 346364,
    imdbId: 'tt4630562',
    type: 'MOVIE' as const,
    slug: 'it-a-coisa-2017',
    titlePt: 'It: A Coisa',
    titleOriginal: 'It',
    year: 2017,
    runtimeMin: 135,
    synopsisPt: 'Em Derry, crianças começam a desaparecer. Um grupo de jovens chamado "Os Perdedores" descobre que um palhaço demoníaco é responsável — e decide enfrentá-lo.',
    synopsisAiQuote: 'Eles também flutuam aqui em baixo.',
    posterUrl: `${TMDB_IMG}/9E2y5Q7WlCCsy9lkDYJbkUjd2Yw.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/tcheoiCBjSNQVUTcBqUaiwqSdHi.jpg`,
    aiMoodTags: ['tense', 'dark', 'scary'],
    aiTags: ['horror', 'stephen-king', 'kids', 'friendship', 'monster'],
    aiComplexity: 'medium',
    aiPace: 'medium',
    aiAnxietyLevel: 5,
    aiBingeWorthy: false,
    aiSafeFor: [],
    aiNotGoodFor: ['before_sleep', 'with_kids', 'hangover', 'anxiety'],
    imdbScore: 7.3,
    rtTomatometer: 86,
    metacritic: 69,
    genreSlugs: ['drama', 'thriller'],
    platforms: [{ slug: 'max', accessType: 'SUBSCRIPTION' as const }, { slug: 'prime-video', accessType: 'RENT' as const }],
  },
  {
    tmdbId: 1396,
    imdbId: 'tt0903747',
    type: 'SERIES' as const,
    slug: 'breaking-bad-2008',
    titlePt: 'Breaking Bad',
    titleOriginal: 'Breaking Bad',
    year: 2008,
    totalSeasons: 5,
    totalEpisodes: 62,
    synopsisPt: 'Walter White, professor de química com câncer terminal, começa a produzir metanfetamina para garantir o futuro da família. Uma das maiores séries já feitas sobre a corrupção humana.',
    synopsisAiQuote: 'Eu não estou em perigo. Eu sou o perigo.',
    posterUrl: `${TMDB_IMG}/ggFHVNu6YYI5L9pCfOacjizRGt.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg`,
    aiMoodTags: ['dark', 'tense', 'thought-provoking'],
    aiTags: ['crime', 'drugs', 'transformation', 'acclaimed', 'slow-burn'],
    aiComplexity: 'complex',
    aiPace: 'slow',
    aiAnxietyLevel: 5,
    aiBingeWorthy: true,
    aiSafeFor: [],
    aiNotGoodFor: ['before_sleep', 'with_kids', 'anxiety'],
    imdbScore: 9.5,
    rtTomatometer: 96,
    metacritic: 87,
    genreSlugs: ['drama', 'crime', 'thriller'],
    platforms: [{ slug: 'netflix', accessType: 'SUBSCRIPTION' as const }],
  },
  {
    tmdbId: 70523,
    imdbId: 'tt5753856',
    type: 'SERIES' as const,
    slug: 'dark-2017',
    titlePt: 'Dark',
    titleOriginal: 'Dark',
    year: 2017,
    totalSeasons: 3,
    totalEpisodes: 26,
    synopsisPt: 'Uma série alemã de ficção científica sobre viagens no tempo que conecta quatro famílias ao longo de várias décadas. A série mais mind-bending da Netflix.',
    synopsisAiQuote: 'O tempo é um nó. E você está preso nele.',
    posterUrl: `${TMDB_IMG}/apbrbWs5eSelectP1QjCPOJRSFpg.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/4F4CKJomikJPx0CMYFevgqTHMxf.jpg`,
    aiMoodTags: ['mind-bending', 'dark', 'tense'],
    aiTags: ['time-travel', 'german', 'sci-fi', 'mystery', 'family'],
    aiComplexity: 'complex',
    aiPace: 'slow',
    aiAnxietyLevel: 3,
    aiBingeWorthy: true,
    aiSafeFor: [],
    aiNotGoodFor: ['before_sleep', 'with_kids', 'hangover'],
    imdbScore: 8.8,
    rtTomatometer: 95,
    metacritic: 88,
    genreSlugs: ['drama', 'ficcao-cientifica', 'misterio'],
    platforms: [{ slug: 'netflix', accessType: 'SUBSCRIPTION' as const }],
  },
  {
    tmdbId: 93405,
    imdbId: 'tt10919420',
    type: 'SERIES' as const,
    slug: 'round-6-2021',
    titlePt: 'Round 6',
    titleOriginal: 'Squid Game',
    year: 2021,
    totalSeasons: 2,
    totalEpisodes: 16,
    synopsisPt: 'Centenas de pessoas endividadas são convidadas a participar de jogos infantis com prêmio milionário. O porém: quem perde, morre. Uma crítica brutal ao capitalismo.',
    synopsisAiQuote: 'A vida é um jogo. E as regras foram feitas para quem tem dinheiro.',
    posterUrl: `${TMDB_IMG}/dDlEmu3EZ0Pgg93X2Fe7HYTwh3K.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/oaGvjB0DvdhXhOAuADfHb261ZHa.jpg`,
    aiMoodTags: ['tense', 'dark', 'thought-provoking'],
    aiTags: ['korean', 'survival', 'capitalism', 'games', 'social-commentary'],
    aiComplexity: 'medium',
    aiPace: 'fast',
    aiAnxietyLevel: 5,
    aiBingeWorthy: true,
    aiSafeFor: [],
    aiNotGoodFor: ['before_sleep', 'with_kids', 'anxiety', 'hangover'],
    imdbScore: 8.0,
    rtTomatometer: 95,
    metacritic: 69,
    genreSlugs: ['drama', 'thriller', 'ficcao-cientifica'],
    platforms: [{ slug: 'netflix', accessType: 'SUBSCRIPTION' as const }],
  },
  {
    tmdbId: 136315,
    imdbId: 'tt14452776',
    type: 'SERIES' as const,
    slug: 'the-bear-2022',
    titlePt: 'The Bear',
    titleOriginal: 'The Bear',
    year: 2022,
    totalSeasons: 3,
    totalEpisodes: 28,
    synopsisPt: 'Um chef estrelado retorna a Chicago para tocar o sanduicheiro da família após a morte do irmão. Caótico, intenso e emocionalmente devastador — como uma cozinha de verdade.',
    synopsisAiQuote: 'Cozinhar não é trabalho. É controle sobre o caos.',
    posterUrl: `${TMDB_IMG}/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/aVLO3CwKKMFCsJH0bGvdSWQMKr0.jpg`,
    aiMoodTags: ['emotional', 'tense', 'thought-provoking'],
    aiTags: ['food', 'kitchen', 'family', 'grief', 'chicago'],
    aiComplexity: 'medium',
    aiPace: 'fast',
    aiAnxietyLevel: 4,
    aiBingeWorthy: true,
    aiSafeFor: ['date_night'],
    aiNotGoodFor: ['before_sleep', 'with_kids', 'anxiety'],
    imdbScore: 8.6,
    rtTomatometer: 99,
    metacritic: 89,
    genreSlugs: ['drama', 'comedia'],
    platforms: [{ slug: 'disney-plus', accessType: 'SUBSCRIPTION' as const }],
  },
  {
    tmdbId: 63247,
    imdbId: 'tt7660850',
    type: 'SERIES' as const,
    slug: 'succession-2018',
    titlePt: 'Succession',
    titleOriginal: 'Succession',
    year: 2018,
    totalSeasons: 4,
    totalEpisodes: 39,
    synopsisPt: 'A família Roy controla um dos maiores conglomerados de mídia do mundo. Quando o patriarca fraqueja, os filhos travam uma guerra brutal pelo poder. Shakespeare no século XXI.',
    synopsisAiQuote: 'Numa família de bilionários, o amor custa caro.',
    posterUrl: `${TMDB_IMG}/e2X8g1NHBBIHMaBV04BZuSwl5GQ.jpg`,
    backdropUrl: `https://image.tmdb.org/t/p/original/bMR1bVvQ22SBzInUHtHPLlkHSHw.jpg`,
    aiMoodTags: ['dark', 'funny', 'thought-provoking'],
    aiTags: ['power', 'family', 'media', 'billionaires', 'satire', 'acclaimed'],
    aiComplexity: 'complex',
    aiPace: 'medium',
    aiAnxietyLevel: 3,
    aiBingeWorthy: true,
    aiSafeFor: ['date_night'],
    aiNotGoodFor: ['with_kids'],
    imdbScore: 8.9,
    rtTomatometer: 99,
    metacritic: 88,
    genreSlugs: ['drama', 'comedia', 'thriller'],
    platforms: [{ slug: 'max', accessType: 'SUBSCRIPTION' as const }],
  },
]

async function main() {
  console.log('→ Criando gêneros...')
  const genreMap: Record<string, number> = {}
  for (const g of genres) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      create: g,
      update: g,
    })
    genreMap[g.slug] = genre.id
  }
  console.log(`  ✓ ${genres.length} gêneros`)

  console.log('→ Buscando plataformas...')
  const platforms = await prisma.platform.findMany({ select: { id: true, slug: true } })
  const platformMap: Record<string, number> = {}
  for (const p of platforms) platformMap[p.slug] = p.id

  if (Object.keys(platformMap).length === 0) {
    console.error('\n⚠ Nenhuma plataforma encontrada. Rode primeiro:')
    console.error('  npm run seed:platforms\n')
    process.exit(1)
  }

  console.log(`  ✓ ${platforms.length} plataformas disponíveis`)
  console.log(`\n→ Criando ${titles.length} títulos...\n`)

  for (const t of titles) {
    const { genreSlugs, platforms: titlePlatforms, imdbScore, rtTomatometer, metacritic, ...titleData } = t

    const title = await prisma.title.upsert({
      where: { tmdbId: t.tmdbId },
      create: { ...titleData, status: 'PUBLISHED', enrichedAt: new Date() },
      update: { ...titleData, status: 'PUBLISHED', enrichedAt: new Date() },
    })

    // Rating
    await prisma.rating.upsert({
      where: { titleId: title.id },
      create: { titleId: title.id, imdbScore, rtTomatometer, metacritic },
      update: { imdbScore, rtTomatometer, metacritic },
    })

    // Gêneros
    for (const slug of genreSlugs) {
      const genreId = genreMap[slug]
      if (!genreId) continue
      await prisma.titleGenre.upsert({
        where: { titleId_genreId: { titleId: title.id, genreId } },
        create: { titleId: title.id, genreId },
        update: {},
      })
    }

    // Disponibilidade
    for (const tp of titlePlatforms) {
      const platformId = platformMap[tp.slug]
      if (!platformId) continue
      await prisma.titleAvailability.upsert({
        where: {
          titleId_platformId_country_accessType: {
            titleId: title.id,
            platformId,
            country: 'BR',
            accessType: tp.accessType,
          },
        },
        create: {
          titleId: title.id,
          platformId,
          country: 'BR',
          accessType: tp.accessType,
          isActive: true,
        },
        update: { isActive: true },
      })
    }

    console.log(`  ✓ ${t.titlePt} (${t.year})`)
  }

  const total = await prisma.title.count({ where: { status: 'PUBLISHED' } })
  console.log(`\n✓ Seed concluído — ${total} títulos publicados no banco.`)
  console.log('  Inicie o app com: npm run dev\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
