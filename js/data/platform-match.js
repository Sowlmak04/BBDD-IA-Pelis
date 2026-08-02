(function () {
  "use strict";

  const ALIASES = new Map([
    ["amazon", "prime-video"],
    ["amazon-prime", "prime-video"],
    ["amazon-prime-video", "prime-video"],
    ["prime", "prime-video"],
    ["prime-video", "prime-video"],
    ["disney", "disney-plus"],
    ["disney-plus", "disney-plus"],
    ["hbo", "max"],
    ["hbo-max", "max"],
    ["max", "max"],
    ["movistar", "movistar-plus"],
    ["movistar-plus", "movistar-plus"],
    ["movistar-plus-plus", "movistar-plus"],
    ["netflix", "netflix"],
    ["apple-tv", "apple-tv-plus"],
    ["apple-tv-plus", "apple-tv-plus"],
    ["appletv", "apple-tv-plus"],
    ["appletv-plus", "apple-tv-plus"],
    ["skyshowtime", "skyshowtime"],
    ["filmin", "filmin"],
    ["crunchyroll", "crunchyroll"],
    ["atresplayer", "atresplayer"],
    ["mitele", "mitele"],
    ["rakuten-tv", "rakuten-tv"],
    ["flixole", "flixole"]
  ]);

  function normalize(value) {
    const normalized = String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " y ")
      .replace(/\+/g, " plus ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");

    return ALIASES.get(normalized) || normalized;
  }

  function manualPlatformKeys(value) {
    return String(value || "")
      .split(/\s*(?:,|;|\/|\||\s+y\s+)\s*/i)
      .map(normalize)
      .filter(Boolean);
  }

  function providerKeys(providers) {
    if (!Array.isArray(providers)) return [];

    return providers
      .map(provider => normalize(
        typeof provider === "string"
          ? provider
          : provider?.name || provider?.providerName || ""
      ))
      .filter(Boolean);
  }

  function matches(item) {
    if (!item || !item.platform) return false;

    const manualKeys = manualPlatformKeys(item.platform);
    const availableKeys = new Set(providerKeys(item.watchProviders));

    return manualKeys.some(key => availableKeys.has(key));
  }

  window.PlatformAvailabilityMatch = Object.freeze({
    normalize,
    matches
  });
})();
