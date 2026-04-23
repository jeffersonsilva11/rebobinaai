const BASE_URL = 'https://www.omdbapi.com'

export const omdb = {
  async getByImdbId(imdbId: string | null) {
    if (!imdbId || !process.env.OMDB_API_KEY) return null

    const url = `${BASE_URL}/?i=${imdbId}&apikey=${process.env.OMDB_API_KEY}`
    const res = await fetch(url)

    if (!res.ok) return null

    const data = await res.json()
    if (data.Response === 'False') return null

    return {
      imdbRating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
      imdbVotes: data.imdbVotes !== 'N/A'
        ? parseInt(data.imdbVotes.replace(/,/g, ''))
        : null,
      rtScore: extractRtScore(data.Ratings),
      metacriticScore: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : null,
      plot: data.Plot !== 'N/A' ? data.Plot : null,
      awards: data.Awards !== 'N/A' ? data.Awards : null,
      boxOffice: data.BoxOffice !== 'N/A' ? data.BoxOffice : null,
    }
  },
}

function extractRtScore(
  ratings: Array<{ Source: string; Value: string }> | undefined
): number | null {
  if (!ratings) return null
  const rt = ratings.find((r) => r.Source === 'Rotten Tomatoes')
  if (!rt) return null
  return parseInt(rt.Value.replace('%', ''))
}
