const BASE_URL = 'https://www.googleapis.com/youtube/v3'

export const youtube = {
  async findTrailer(query: string): Promise<string | null> {
    if (!process.env.YOUTUBE_API_KEY) return null

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: '1',
        key: process.env.YOUTUBE_API_KEY,
      })

      const res = await fetch(`${BASE_URL}/search?${params}`)
      if (!res.ok) return null

      const data = await res.json()
      return data.items?.[0]?.id?.videoId ?? null
    } catch {
      return null
    }
  },
}
