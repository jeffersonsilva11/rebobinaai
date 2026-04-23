// src/types/api.ts
// Types comuns de respostas de API

export interface ApiError {
  error: string
  details?: string
}

export interface ApiSuccess<T> {
  ok: true
  data: T
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface WatchlistItemDto {
  id: string
  userId: string
  titleId: string
  status: 'WANT' | 'WATCHING' | 'WATCHED'
  userRating: number | null
  userReview: string | null
  notifyAvailable: boolean
  addedAt: string
  watchedAt: string | null
}
