// src/lib/ai/enricher.ts
// Wrapper para chamar o Claude Haiku com o prompt de enriquecimento

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { ENRICH_TITLE_PROMPT } from './prompts'

let _anthropic: Anthropic | null = null
let _openai: OpenAI | null = null

export function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _anthropic
}

export function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

export interface EnrichContext {
  title: string
  type: string
  year: number
  runtime: string
  genres: string
  synopsis: string
  imdbScore?: number | null
  cast: string
  director: string
}

export interface EnrichOutput {
  synopsisPt: string
  aiQuote: string
  aiTags: string[]
  aiMoodTags: string[]
  complexity: string
  pace: string
  anxietyLevel: number
  bingeWorthy: boolean
  safeFor: string[]
  notGoodFor: string[]
  trivia: { text: string }[]
  opinionSummary: string
  seoMetaTitle: string
  seoMetaDesc: string
  schemaOrg: Record<string, any>
}

export async function callClaudeEnricher(ctx: EnrichContext): Promise<EnrichOutput> {
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: ENRICH_TITLE_PROMPT(ctx) }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error(`[enricher] Parse falhou: ${text.slice(0, 200)}`)
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return response.data[0].embedding
}
