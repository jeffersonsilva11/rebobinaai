// src/lib/ai/prompts.ts
// Todos os prompts da IA centralizados aqui

export const ENRICH_TITLE_PROMPT = (ctx: {
  title: string
  type: string
  year: number
  runtime: string
  genres: string
  synopsis: string
  imdbScore?: number | null
  cast: string
  director: string
}) => `Você é um especialista em cinema e séries trabalhando para o Rebobina.ai,
um site brasileiro de descoberta de entretenimento.

Analise esse título e retorne SOMENTE um JSON válido, sem markdown, sem explicações.

TÍTULO: ${ctx.title}
TIPO: ${ctx.type}
ANO: ${ctx.year}
DURAÇÃO: ${ctx.runtime}
GÊNEROS: ${ctx.genres}
SINOPSE (EN): ${ctx.synopsis}
NOTA IMDB: ${ctx.imdbScore ?? 'N/A'}
ELENCO PRINCIPAL: ${ctx.cast}
DIRETOR: ${ctx.director}

Retorne exatamente este JSON:
{
  "synopsisPt": "sinopse em português brasileiro, fluida e atrativa, 3-4 frases, sem spoilers",
  "aiQuote": "uma frase de impacto em PT sobre o filme, como um crítico escreveria, máx 120 chars",
  "aiTags": ["tag1", "tag2"],
  "aiMoodTags": ["feel-good"],
  "complexity": "low"|"medium"|"high",
  "pace": "slow"|"medium"|"fast",
  "anxietyLevel": 1,
  "bingeWorthy": true,
  "safeFor": ["relaxing"],
  "notGoodFor": ["anxiety"],
  "trivia": [
    {"text": "curiosidade interessante em PT, 1-2 frases"},
    {"text": "segunda curiosidade"},
    {"text": "terceira curiosidade"}
  ],
  "opinionSummary": "2-3 frases em PT resumindo o que o público e crítica acham",
  "seoMetaTitle": "máx 60 chars",
  "seoMetaDesc": "máx 160 chars",
  "schemaOrg": {
    "@context": "https://schema.org",
    "@type": "${ctx.type === 'MOVIE' ? 'Movie' : 'TVSeries'}",
    "name": "${ctx.title}",
    "datePublished": "${ctx.year}",
    "description": "mesma synopsisPt acima"
  }
}

Regras:
- aiTags: 5-10 tags descritivas livres em inglês (ex: "based-on-true-story", "female-led")
- aiMoodTags: 2-4 tags de: feel-good, tense, dark, uplifting, funny, romantic, inspiring, sad, scary, thought-provoking, cozy, intense, wholesome
- anxietyLevel: 1=muito tranquilo, 5=máxima tensão
- safeFor: relaxing, before_sleep, bad_day, kids, date_night, family
- notGoodFor: anxiety, sensitive_topics, kids, before_sleep
- NUNCA inclua spoilers
- Escreva em PT-BR natural`

export const EXTRACT_INTENT_PROMPT = (query: string) => `Extraia a intenção de busca dessa query de entretenimento.
Retorne SOMENTE JSON válido, sem markdown.

Query: "${query}"

JSON:
{
  "type": "MOVIE"|"SERIES"|"ALL",
  "moodTags": ["feel-good"|"tense"|"dark"|"uplifting"|"funny"|"romantic"|"inspiring"|"sad"|"scary"|"thought-provoking"|"cozy"|"intense"],
  "maxAnxietyLevel": 1-5,
  "maxRuntimeMin": number|null,
  "complexity": "low"|"medium"|"high"|null,
  "languages": ["pt"|"en"|"es"|"fr"|"ko"|"ja"|"it"|"de"]|null,
  "safeFor": ["relaxing"|"before_sleep"|"bad_day"|"kids"|"date_night"]|null,
  "era": "classic"|"modern"|"recent"|null,
  "summary": "resumo em 1 frase do que o usuário quer"
}`

export const PERSON_BIO_PROMPT = (name: string, knownFor: string[]) =>
  `Escreva uma bio em PT-BR (3-4 frases) para ${name}, conhecido(a) por ${knownFor.join(', ')}.
Não inclua spoilers nem rumores. Retorne apenas o texto da bio.`
