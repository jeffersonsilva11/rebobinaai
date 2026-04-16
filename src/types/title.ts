// src/types/title.ts
// Types do domínio de títulos

export type TitleType = 'MOVIE' | 'SERIES' | 'DOCUMENTARY' | 'MINISERIES' | 'SPECIAL'
export type TitleStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED'
export type AccessType = 'SUBSCRIPTION' | 'RENT' | 'BUY' | 'FREE'
export type CastRole = 'ACTOR' | 'DIRECTOR' | 'WRITER' | 'DOP' | 'MUSIC' | 'PRODUCER' | 'EDITOR'

export interface TitleSummary {
  id: string
  slug: string
  titlePt: string
  year: number
  type: TitleType
  posterUrl: string | null
  ratings?: { imdbScore: number | null } | null
}

export interface Availability {
  id: string
  accessType: AccessType
  deeplinkUrl: string | null
  platform: {
    id: number
    name: string
    slug: string
    colorHex: string | null
    baseUrlBr: string | null
  }
}

export interface TitleDetail extends TitleSummary {
  titleOriginal: string
  endYear: number | null
  runtimeMin: number | null
  totalEpisodes: number | null
  totalSeasons: number | null
  synopsisPt: string | null
  synopsisAiQuote: string | null
  aiTrivia: { text: string }[] | null
  aiOpinionSummary: string | null
  backdropUrl: string | null
  trailerYoutubeId: string | null
  ratingAge: string | null
  aiMoodTags: string[]
  aiTags: string[]
  aiComplexity: string | null
  aiPace: string | null
  aiAnxietyLevel: number | null
  aiBingeWorthy: boolean | null
  seoMetaTitle: string | null
  seoMetaDesc: string | null
  schemaOrg: any
}
