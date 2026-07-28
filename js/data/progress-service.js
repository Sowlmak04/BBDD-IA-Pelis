// ---------- Servicio de progreso de series ----------
const SeriesProgressService = (() => {
  function toInt(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : fallback;
  }

  function normalizeLog(log) {
    return (Array.isArray(log) ? log : [])
      .map(entry => ({
        at: Number(entry?.at) || Date.now(),
        season: toInt(entry?.season),
        episode: toInt(entry?.episode),
        action: String(entry?.action || "actualizado")
      }))
      .filter(entry => entry.season > 0 || entry.episode > 0);
  }

  function snapshot(item) {
    const season = Math.max(1, toInt(item?.currentSeason, 1));
    const episode = toInt(item?.currentEpisode, 0);
    const seasons = toInt(item?.seasons, 0);
    const totalEpisodes = toInt(item?.episodes, 0);
    const episodesPerSeason = toInt(item?.episodesPerSeason, 0);

    let watchedEpisodes = episode;
    let estimatedTotal = totalEpisodes;

    if (episodesPerSeason > 0) {
      watchedEpisodes = ((season - 1) * episodesPerSeason) + episode;
      if (!estimatedTotal && seasons > 0) {
        estimatedTotal = seasons * episodesPerSeason;
      }
    }

    const percentage = estimatedTotal > 0
      ? Math.min(100, Math.max(0, Math.round((watchedEpisodes / estimatedTotal) * 100)))
      : null;

    return {
      season,
      episode,
      seasons,
      totalEpisodes,
      episodesPerSeason,
      watchedEpisodes,
      estimatedTotal,
      percentage,
      lastProgressAt: Number(item?.lastProgressAt) || null,
      progressLog: normalizeLog(item?.progressLog)
    };
  }

  function change(id, direction) {
    const key = KEY.seriesPendientes;
    const current = LibraryService.getById(key, id);
    if (!current) return null;

    const progress = snapshot(current);
    let season = progress.season;
    let episode = progress.episode;
    let action = direction === "back" ? "retroceso" : "avance";

    if (direction === "back") {
      if (episode > 1) {
        episode -= 1;
      } else if (season > 1 && progress.episodesPerSeason > 0) {
        season -= 1;
        episode = progress.episodesPerSeason;
      } else {
        episode = Math.max(0, episode - 1);
      }
    } else if (
      progress.episodesPerSeason > 0 &&
      episode >= progress.episodesPerSeason &&
      (!progress.seasons || season < progress.seasons)
    ) {
      season += 1;
      episode = 1;
      action = "nueva temporada";
    } else {
      episode += 1;
    }

    if (
      progress.seasons > 0 &&
      progress.episodesPerSeason > 0 &&
      season >= progress.seasons &&
      episode > progress.episodesPerSeason
    ) {
      episode = progress.episodesPerSeason;
    }

    const at = Date.now();
    return LibraryService.update(key, id, item => ({
      ...item,
      currentSeason: String(season),
      currentEpisode: String(episode),
      lastProgressAt: at,
      progressLog: [
        ...normalizeLog(item.progressLog),
        { at, season, episode, action }
      ].slice(-100),
      updatedAt: at
    }));
  }

  function formatDate(value) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date(timestamp));
  }

  return Object.freeze({
    snapshot,
    advance: id => change(id, "advance"),
    back: id => change(id, "back"),
    formatDate,
    normalizeLog
  });
})();