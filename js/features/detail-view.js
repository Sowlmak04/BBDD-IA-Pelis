// ---------- Sprint 12.2 · Ficha detallada y disponibilidad por suscripción ----------
const DetailView = (() => {
  const screen = document.getElementById("detailViewScreen");
  const content = document.getElementById("detailViewContent");
  const title = document.getElementById("detailViewTitle");
  const back = document.getElementById("detailViewBack");

  let context = null;
  const escape = value => escapeHtml(String(value ?? ""));

  function keyFromContext(value) {
    if (value?.listKey) return value.listKey;
    const isSeries = value?.kind === "series";
    const isViewed = value?.status === "vistas";
    return isSeries
      ? (isViewed ? KEY.seriesVistas : KEY.seriesPendientes)
      : (isViewed ? KEY.peliculasVistas : KEY.peliculasPendientes);
  }

  function readItem() {
    if (!context?.id) return null;
    return loadArray(keyFromContext(context)).find(item => item.id === context.id) || null;
  }

  const list = value => Array.isArray(value) ? value.filter(Boolean) : [];

  function row(label, value) {
    const text = String(value ?? "").trim();
    return `<div class="detailMetaRow"><dt>${escape(label)}</dt><dd class="${text ? "" : "detailEmpty"}">${escape(text || "No disponible")}</dd></div>`;
  }

  function section(id, heading, body, open = false, upcoming = false) {
    return `<details class="detailSection${upcoming ? " detailSectionUpcoming" : ""}" ${open ? "open" : ""}>
      <summary><span>${escape(heading)}</span>${upcoming ? '<small>Próximamente</small>' : ""}</summary>
      <div class="detailSectionBody" id="${escape(id)}">${body}</div>
    </details>`;
  }

  function formatDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const date = new Date(`${raw}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? raw
      : new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(date);
  }

  function uniqueNames(values) {
    return [...new Set(list(values).map(value => String(value?.name || value || "").trim()).filter(Boolean))];
  }

  function castMarkup(item) {
    const cast = list(item.cast).slice(0, 15);
    if (!cast.length) return '<p class="detailEmpty">No hay información de reparto. Pulsa «Actualizar desde TMDb».</p>';
    return `<div class="detailCastGrid">${cast.map(person => `
      <article class="detailCastCard">
        ${person.profileUrl ? `<img src="${escape(person.profileUrl)}" alt="Foto de ${escape(person.name)}" loading="lazy">` : '<div class="detailCastPhotoEmpty" aria-hidden="true">👤</div>'}
        <div><strong>${escape(person.name)}</strong><span>${escape(person.character || "Personaje no disponible")}</span></div>
      </article>`).join("")}</div>`;
  }

  function crewMarkup(item) {
    const groups = [];
    const creators = uniqueNames(item.creators);
    if (creators.length) groups.push(["Creación", creators]);

    const jobLabels = {
      "Director": "Dirección",
      "Writer": "Guion",
      "Screenplay": "Guion",
      "Executive Producer": "Producción ejecutiva"
    };
    const musicJobs = new Set([
      "Original Music Composer",
      "Music",
      "Music Composer",
      "Composer",
      "Main Title Theme Composer",
      "Theme Song Performance"
    ]);
    const grouped = new Map();
    const composers = [];

    list(item.crew).forEach(person => {
      if (musicJobs.has(person.job)) {
        composers.push(person.name);
        return;
      }
      const label = jobLabels[person.job];
      if (!label) return;
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label).push(person.name);
    });

    grouped.forEach((names, label) => groups.push([label, [...new Set(names)]]));
    groups.push(["Música / Compositor", [...new Set(composers.filter(Boolean))]]);

    return `<dl class="detailCrewList">${groups.map(([label, names]) => `<div><dt>${escape(label)}</dt><dd class="${names.length ? "" : "detailEmpty"}">${escape(names.length ? names.join(", ") : "No disponible")}</dd></div>`).join("")}</dl>`;
  }

  function formatUpdateDate(value) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(timestamp));
  }

  function availabilityMarkup(item) {
    const providers = list(item.watchProviders);
    const hasBeenChecked = Number(item.watchProvidersUpdatedAt) > 0;
    const region = String(item.watchRegion || TMDbClient.WATCH_REGION || "ES").toUpperCase();
    const providerGrid = providers.length
      ? `<div class="detailProviderGrid">${providers.map(provider => `
          <article class="detailProviderCard" title="${escape(provider.name)}">
            ${provider.logoUrl
              ? `<img src="${escape(provider.logoUrl)}" alt="${escape(provider.name)}" loading="lazy">`
              : '<div class="detailProviderLogoEmpty" aria-hidden="true">▶</div>'}
            <strong>${escape(provider.name)}</strong>
          </article>`).join("")}</div>`
      : `<p class="detailEmpty">${hasBeenChecked
          ? "No está disponible mediante suscripción en España."
          : "Aún no se ha consultado la disponibilidad mediante suscripción."}</p>`;

    return `<div class="detailAvailability">
      <div class="detailAvailabilityHeader">
        <div><strong>Suscripción</strong><span>Región: ${escape(region === "ES" ? "España" : region)}</span></div>
        ${item.tmdbId
          ? '<button class="toolBtn" type="button" data-availability-refresh>Actualizar disponibilidad</button>'
          : ''}
      </div>
      ${providerGrid}
      <p class="detailAvailabilityUpdated" data-availability-message aria-live="polite">${hasBeenChecked
        ? `Actualizado el ${escape(formatUpdateDate(item.watchProvidersUpdatedAt))}.`
        : ""}</p>
    </div>`;
  }

  function render() {
    const item = readItem();
    if (!item) {
      title.textContent = "Información detallada";
      content.innerHTML = '<div class="detailViewError">No se ha encontrado este registro.</div>';
      return;
    }

    title.textContent = item.title || "Información detallada";
    const countries = list(item.originCountries).join(", ");
    const languages = list(item.spokenLanguages).join(", ");
    const companies = list(item.productionCompanies).map(company => company?.name || "").filter(Boolean).join(", ");
    const synopsis = String(item.synopsis || item.notes || "").trim();
    const isSeries = context.kind === "series";

    const header = `<article class="detailHero">
      ${item.posterUrl ? `<img src="${escape(item.posterUrl)}" alt="Póster de ${escape(item.title)}" class="detailHeroPoster">` : '<div class="detailHeroPoster detailHeroPosterEmpty">Sin póster</div>'}
      <div class="detailHeroText">
        <p class="detailHeroEyebrow">${escape(isSeries ? "Serie" : "Película")} · ${escape(context.status === "vistas" ? "Vista" : "Pendiente")}</p>
        <h2>${escape(item.title || "Sin título")}</h2>
        ${item.tagline ? `<p class="detailTagline">${escape(item.tagline)}</p>` : ""}
        <p>${escape([item.year, item.genre].filter(Boolean).join(" · ") || "Sin metadatos principales")}</p>
        ${item.tmdbId ? '<button class="toolBtn" type="button" data-detail-refresh>Actualizar desde TMDb</button>' : '<p class="detailNoTmdb">Vincula este registro con TMDb desde Editar para completar sus datos.</p>'}
        <div class="detailSyncMessage" data-detail-message aria-live="polite"></div>
      </div>
    </article>`;

    const summary = `<div class="detailSynopsis ${synopsis ? "" : "detailEmpty"}">${escape(synopsis || "Sin sinopsis disponible.")}</div>
      <dl class="detailMetaGrid">
        ${row("Título original", item.originalTitle)}
        ${row(isSeries ? "Primera emisión" : "Estreno", formatDate(item.releaseDate))}
        ${isSeries ? row("Última emisión", formatDate(item.lastAirDate)) : ""}
        ${row("Duración", item.duration)}
        ${isSeries ? row("Temporadas", item.seasons) : ""}
        ${isSeries ? row("Episodios", item.episodes) : ""}
        ${row("Idioma original", item.originalLanguage)}
        ${row("Idiomas hablados", languages)}
        ${row("Países de origen", countries)}
        ${row("Estado de producción", item.productionStatus || item.tmdbStatus)}
        ${row("Productoras", companies)}
        ${row("Clasificación para adultos", item.adult ? "Sí" : "No")}
      </dl>`;

    const upcoming = '<p class="detailUpcomingText">Esta sección se completará en los próximos sprints sin ampliar la ficha principal.</p>';
    const dubbing = '<p class="detailEmpty">Sin datos disponibles.</p>';
    const availability = availabilityMarkup(item);

    content.innerHTML = header + `<div class="detailSections">
      ${section("detail-summary", "Resumen e información", summary)}
      ${section("detail-cast", "Reparto principal", castMarkup(item))}
      ${section("detail-crew", "Equipo técnico", crewMarkup(item))}
      ${section("detail-dubbing", "Doblaje", dubbing)}
      ${section("detail-availability", "Disponibilidad", availability)}
      ${section("detail-media", "Multimedia", upcoming, false, true)}
    </div>`;
  }

  async function refresh(button) {
    const item = readItem();
    const message = content.querySelector("[data-detail-message]");
    if (!item?.tmdbId) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Actualizando…";
    if (message) message.textContent = context.kind === "series" ? "Actualizando datos y temporadas…" : "Actualizando datos de la película…";

    try {
      const details = await TMDbClient.details(item.tmdbId, context.kind);
      const key = keyFromContext(context);
      saveArray(key, loadArray(key).map(current => current.id === item.id ? { ...current, ...details, updatedAt: Date.now() } : current));
      render();
      const freshMessage = content.querySelector("[data-detail-message]");
      if (freshMessage) freshMessage.textContent = context.kind === "series" ? "Datos y temporadas actualizados correctamente." : "Datos de la película actualizados correctamente.";
      context.status === "vistas"
        ? renderVistas(context.kind)
        : renderPendientes(context.kind);
    } catch (error) {
      console.error(error);
      button.disabled = false;
      button.textContent = original;
      if (message) message.textContent = error?.message === "TMDB_TOKEN_MISSING" ? "Configura el token de TMDb antes de actualizar." : "No se pudieron actualizar los datos de TMDb.";
    }
  }

  async function refreshAvailability(button) {
    const item = readItem();
    const message = content.querySelector("[data-availability-message]");
    if (!item?.tmdbId) return;

    const original = button.textContent;
    button.disabled = true;
    button.textContent = "Consultando…";
    if (message) message.textContent = "Consultando disponibilidad en España…";

    try {
      const availability = await TMDbClient.watchProviders(
        item.tmdbId,
        context.kind,
        TMDbClient.WATCH_REGION
      );
      const key = keyFromContext(context);
      saveArray(key, loadArray(key).map(current =>
        current.id === item.id
          ? { ...current, ...availability, updatedAt: Date.now() }
          : current
      ));
      render();
      const freshItem = readItem();
      const freshMessage = content.querySelector("[data-availability-message]");
      if (freshMessage) {
        freshMessage.textContent = list(freshItem?.watchProviders).length
          ? `Disponibilidad actualizada: ${freshItem.watchProviders.length} plataforma${freshItem.watchProviders.length === 1 ? "" : "s"} de suscripción.`
          : "Disponibilidad actualizada: no figura en plataformas de suscripción en España.";
      }
      context.status === "vistas"
        ? renderVistas(context.kind)
        : renderPendientes(context.kind);
    } catch (error) {
      console.error(error);
      button.disabled = false;
      button.textContent = original;
      if (message) {
        message.textContent = error?.message === "TMDB_TOKEN_MISSING"
          ? "Configura el token de TMDb antes de consultar la disponibilidad."
          : "No se pudo consultar la disponibilidad en TMDb.";
      }
    }
  }

  function open(value) {
    context = { ...value, returnScreen: value?.returnScreen || "resumen-home" };
    document.body.classList.add("detail-view-open");
    render();
    showScreen("ficha-detallada");
    screen.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function close() {
    document.body.classList.remove("detail-view-open");
    showScreen(context?.returnScreen || "resumen-home");
  }

  back?.addEventListener("click", close);
  content?.addEventListener("click", event => {
    const refreshButton = event.target.closest("[data-detail-refresh]");
    if (refreshButton) {
      refresh(refreshButton);
      return;
    }
    const availabilityButton = event.target.closest("[data-availability-refresh]");
    if (availabilityButton) refreshAvailability(availabilityButton);
  });

  return { open, render };
})();
