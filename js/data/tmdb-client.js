// ---------- Cliente TMDb ----------
const TMDbClient = (() => {
  const TOKEN_KEY = "inv_tmdb_read_token_v1";
  const CONFIG_KEY = "inv_tmdb_image_config_v1";
  const API_BASE = "https://api.themoviedb.org/3";
  const DEFAULT_IMAGE_BASE = "https://image.tmdb.org/t/p/";

  function getToken() {
    return (localStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function setToken(token) {
    const clean = String(token || "").trim();

    if (clean) {
      localStorage.setItem(TOKEN_KEY, clean);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    return clean;
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function hasToken() {
    return Boolean(getToken());
  }

  async function request(path, params = {}) {
    const token = getToken();

    if (!token) {
      throw new Error("TMDB_TOKEN_MISSING");
    }

    const url = new URL(API_BASE + path);

    Object.entries({
      language: "es-ES",
      ...params
    }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    if (response.status === 401) {
      throw new Error("TMDB_TOKEN_INVALID");
    }

    if (!response.ok) {
      throw new Error(`TMDB_HTTP_${response.status}`);
    }

    return response.json();
  }

  async function testConnection() {
    await request("/configuration");
    return true;
  }

  async function getImageConfiguration() {
    const cachedRaw = localStorage.getItem(CONFIG_KEY);

    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);

        if (
          cached &&
          cached.secureBaseUrl &&
          Array.isArray(cached.posterSizes)
        ) {
          return cached;
        }
      } catch {
        localStorage.removeItem(CONFIG_KEY);
      }
    }

    const data = await request("/configuration");
    const config = {
      secureBaseUrl:
        data?.images?.secure_base_url || DEFAULT_IMAGE_BASE,
      posterSizes:
        Array.isArray(data?.images?.poster_sizes)
          ? data.images.poster_sizes
          : ["w342"]
    };

    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return config;
  }

  function choosePosterSize(sizes) {
    const preferred = ["w342", "w300", "w500", "original"];
    return preferred.find(size => sizes.includes(size)) || sizes[0] || "w342";
  }

  async function posterUrl(path) {
    if (!path) return "";

    try {
      const config = await getImageConfiguration();
      const size = choosePosterSize(config.posterSizes);
      return `${config.secureBaseUrl}${size}${path}`;
    } catch {
      return `${DEFAULT_IMAGE_BASE}w342${path}`;
    }
  }

  function mediaType(kind) {
    return kind === "series" ? "tv" : "movie";
  }

  async function search(query, kind) {
    const type = mediaType(kind);
    const data = await request(`/search/${type}`, {
      query,
      include_adult: false,
      page: 1,
      region: "ES"
    });

    return (Array.isArray(data?.results) ? data.results : [])
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        mediaType: type,
        title: type === "tv" ? item.name : item.title,
        originalTitle:
          type === "tv" ? item.original_name : item.original_title,
        date:
          type === "tv" ? item.first_air_date : item.release_date,
        year:
          String(
            type === "tv"
              ? item.first_air_date || ""
              : item.release_date || ""
          ).slice(0, 4),
        overview: item.overview || "",
        posterPath: item.poster_path || "",
        popularity: Number(item.popularity) || 0
      }));
  }

  async function details(id, kind) {
    const type = mediaType(kind);
    const data = await request(`/${type}/${id}`, {
      append_to_response: type === "tv"
        ? "content_ratings"
        : "release_dates"
    });

    const genres = Array.isArray(data?.genres)
      ? data.genres.map(genre => genre.name).filter(Boolean)
      : [];

    let duration = "";

    if (type === "movie" && Number(data?.runtime) > 0) {
      const minutes = Number(data.runtime);
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      duration = hours
        ? `${hours}h${rest ? ` ${rest}m` : ""}`
        : `${rest} min`;
    }

    if (type === "tv") {
      const runtimes = Array.isArray(data?.episode_run_time)
        ? data.episode_run_time.filter(value => Number(value) > 0)
        : [];

      if (runtimes.length) {
        duration = `${runtimes[0]} min/ep`;
      }
    }

    const rawSeasons =
      type === "tv" && Array.isArray(data?.seasons)
        ? data.seasons
        : [];

    const normalizeSeason = season => ({
      seasonNumber: Number(season?.season_number) || 0,
      episodeCount: Math.max(0, Number(season?.episode_count) || 0),
      name: String(season?.name || "").trim(),
      airDate: String(season?.air_date || "").trim(),
      posterPath: String(season?.poster_path || "").trim(),
      tmdbId: Number(season?.id) || null
    });

    const seasonsData = rawSeasons
      .map(normalizeSeason)
      .filter(season => season.seasonNumber > 0)
      .sort((a, b) => a.seasonNumber - b.seasonNumber);

    const specialsData = rawSeasons
      .map(normalizeSeason)
      .filter(season => season.seasonNumber === 0);

    const episodesBySeason = seasonsData.map(season =>
      String(season.episodeCount)
    );

    const knownEpisodeTotal = seasonsData.reduce(
      (sum, season) => sum + season.episodeCount,
      0
    );

    const seasonsUpdatedAt = Date.now();

    return {
      tmdbId: data.id,
      tmdbType: type,
      title: type === "tv" ? data.name : data.title,
      originalTitle:
        type === "tv" ? data.original_name : data.original_title,
      year: String(
        type === "tv"
          ? data.first_air_date || ""
          : data.release_date || ""
      ).slice(0, 4),
      synopsis: data.overview || "",
      genre: genres.join(", "),
      duration,
      seasons:
        type === "tv"
          ? String(seasonsData.length || Math.max(0, Number(data.number_of_seasons) || 0))
          : "",
      episodes:
        type === "tv"
          ? String(knownEpisodeTotal || Math.max(0, Number(data.number_of_episodes) || 0))
          : "",
      episodesBySeason,
      seasonsData,
      specialsData,
      tmdbStatus: type === "tv" ? String(data.status || "").trim() : "",
      tmdbSeasonsUpdatedAt: type === "tv" ? seasonsUpdatedAt : null,
      posterPath: data.poster_path || "",
      posterUrl: await posterUrl(data.poster_path),
      backdropPath: data.backdrop_path || "",
      originalLanguage: data.original_language || "",
      originCountries: (
        type === "tv"
          ? (Array.isArray(data.origin_country) ? data.origin_country : [])
          : (Array.isArray(data.production_countries) ? data.production_countries : [])
              .map(country => country?.name || country?.iso_3166_1 || "")
      )
        .map(value => String(value || "").trim())
        .filter(Boolean),
      spokenLanguages: (Array.isArray(data.spoken_languages) ? data.spoken_languages : [])
        .map(language => String(language?.name || language?.english_name || "").trim())
        .filter(Boolean),
      productionCompanies: (Array.isArray(data.production_companies) ? data.production_companies : [])
        .map(company => ({
          id: Number(company?.id) || null,
          name: String(company?.name || "").trim(),
          originCountry: String(company?.origin_country || "").trim(),
          logoPath: String(company?.logo_path || "").trim()
        }))
        .filter(company => company.name),
      productionStatus: String(data.status || "").trim(),
      tmdbVoteAverage: Number(data.vote_average) || null,
      tmdbUpdatedAt: Date.now()
    };
  }

  return Object.freeze({
    TOKEN_KEY,
    getToken,
    setToken,
    clearToken,
    hasToken,
    testConnection,
    search,
    details,
    posterUrl
  });
})();
