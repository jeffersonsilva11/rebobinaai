const BASE_URL = 'https://api.themoviedb.org/3'

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('language', 'pt-BR')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${path}`)
  }

  return res.json()
}

export const tmdb = {
  async getMovie(id: number) {
    const data = await tmdbFetch(`/movie/${id}`, { append_to_response: 'release_dates' })
    const brRelease = data.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'BR')
    const certification = brRelease?.release_dates?.[0]?.certification

    return {
      tmdbId: data.id,
      imdbId: data.imdb_id,
      titlePt: data.title,
      titleOriginal: data.original_title,
      year: new Date(data.release_date).getFullYear(),
      endYear: null,
      runtimeMin: data.runtime,
      totalEpisodes: null,
      totalSeasons: null,
      posterUrl: data.poster_path,
      backdropUrl: data.backdrop_path,
      ratingAge: certification || null,
      countries: data.production_countries?.map((c: any) => c.iso_3166_1) ?? [],
      languages: data.spoken_languages?.map((l: any) => l.iso_639_1) ?? [],
      genres: data.genres ?? [],
      voteAverage: data.vote_average,
      overview: data.overview,
    }
  },

  async getSeries(id: number) {
    const data = await tmdbFetch(`/tv/${id}`, { append_to_response: 'content_ratings' })
    const brRating = data.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'BR')

    const firstAirYear = data.first_air_date
      ? new Date(data.first_air_date).getFullYear()
      : new Date().getFullYear()

    const lastAirYear = data.last_air_date
      ? new Date(data.last_air_date).getFullYear()
      : null

    return {
      tmdbId: data.id,
      imdbId: null,
      titlePt: data.name,
      titleOriginal: data.original_name,
      year: firstAirYear,
      endYear: data.status === 'Ended' ? lastAirYear : null,
      runtimeMin: data.episode_run_time?.[0] ?? null,
      totalEpisodes: data.number_of_episodes,
      totalSeasons: data.number_of_seasons,
      posterUrl: data.poster_path,
      backdropUrl: data.backdrop_path,
      ratingAge: brRating?.rating || null,
      countries: data.production_countries?.map((c: any) => c.iso_3166_1) ?? [],
      languages: data.spoken_languages?.map((l: any) => l.iso_639_1) ?? [],
      genres: data.genres ?? [],
      voteAverage: data.vote_average,
      overview: data.overview,
    }
  },

  async getCredits(id: number, type: string) {
    const mediaType = type === 'MOVIE' ? 'movie' : 'tv'
    return tmdbFetch(`/${mediaType}/${id}/credits`)
  },

  async getExternalIds(id: number, type: string) {
    const mediaType = type === 'MOVIE' ? 'movie' : 'tv'
    const data = await tmdbFetch(`/${mediaType}/${id}/external_ids`)
    return {
      imdbId: data.imdb_id,
      instagramId: data.instagram_id,
      twitterId: data.twitter_id,
      facebookId: data.facebook_id,
    }
  },

  async getWatchProviders(id: number, type: string, country: string = 'BR') {
    const mediaType = type === 'MOVIE' ? 'movie' : 'tv'
    const data = await tmdbFetch(`/${mediaType}/${id}/watch/providers`)
    return data.results ?? {}
  },

  async getVideos(id: number, type: string) {
    const mediaType = type === 'MOVIE' ? 'movie' : 'tv'
    const data = await tmdbFetch(`/${mediaType}/${id}/videos`, { language: 'pt-BR' })

    // Tenta trailer em PT-BR primeiro, depois EN
    let trailer = data.results?.find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
    )

    if (!trailer) {
      const enData = await tmdbFetch(`/${mediaType}/${id}/videos`, { language: 'en-US' })
      trailer = enData.results?.find(
        (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
      )
    }

    return { trailerKey: trailer?.key ?? null }
  },

  async getTrending(type: 'movie' | 'tv', window: 'day' | 'week' = 'week') {
    const data = await tmdbFetch(`/trending/${type}/${window}`)
    return data.results ?? []
  },

  async getNowPlaying() {
    const data = await tmdbFetch('/movie/now_playing', { region: 'BR' })
    return data.results ?? []
  },

  async getOnAir() {
    const data = await tmdbFetch('/tv/on_the_air')
    return data.results ?? []
  },

  async getPopularMovies(page: number = 1) {
    const data = await tmdbFetch('/movie/popular', { page: String(page), region: 'BR' })
    return data.results ?? []
  },

  async getPopularSeries(page: number = 1) {
    const data = await tmdbFetch('/tv/popular', { page: String(page) })
    return data.results ?? []
  },
}
