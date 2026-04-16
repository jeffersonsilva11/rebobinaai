// src/types/search.ts
// Types da busca IA

export interface SearchIntent {
  type?: 'MOVIE' | 'SERIES' | 'ALL'
  moodTags?: string[]
  maxAnxietyLevel?: number | null
  maxRuntimeMin?: number | null
  complexity?: 'low' | 'medium' | 'high' | null
  languages?: string[] | null
  safeFor?: string[] | null
  era?: 'classic' | 'modern' | 'recent' | null
  summary?: string
}

export interface SearchResultAvailability {
  platformId: number
  platformName: string
  platformSlug: string
  colorHex: string | null
  accessType: string
  deeplinkUrl: string | null
}

export interface SearchResult {
  id: string
  slug: string
  title_pt: string
  title_original: string
  year: number
  type: 'MOVIE' | 'SERIES'
  runtime_min: number | null
  poster_url: string | null
  synopsis_pt: string | null
  ai_mood_tags: string[]
  ai_tags: string[]
  ai_anxiety_level: number | null
  ai_pace: string | null
  ai_opinion_summary: string | null
  imdb_score: number | null
  rt_tomatometer: number | null
  distance: number
  matchScore: number
  aiReason: string
  availability: SearchResultAvailability[]
}

export interface SearchResponse {
  query: string
  intent: SearchIntent
  results: SearchResult[]
  total: number
  sessionId: string
}

export interface SearchRequest {
  query: string
  platformFilter?: number[]
  typeFilter?: 'MOVIE' | 'SERIES' | 'ALL'
  page?: number
}
