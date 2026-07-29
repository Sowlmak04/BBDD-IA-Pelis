// ---------- Sprint 12.1 · Ficha detallada ampliada ----------
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
      "Executive Producer": "Producción ejecutiva",
      "Original Music Composer": "Música"
    };
    const grouped = new Map();
    list(item.crew).forEach(person => {
      const label = jobLabels[person.job];
      if (!label) return;
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label).push(person.name);
    });
    grouped.forEach((names, label) => groups.push([label, [...new Set(names)]]));
    if (!groups.length) return '<p class="detailEmpty">No hay información del equipo técnico. Pulsa «Actualizar desde TMDb».</p>';
    return `<dl class="detailCrewList">${groups.map(([label, names]) => `<div><dt>${escape(label)}</dt><dd>${escape(names.join(", "))}</dd></div>`).join("")}</dl>`;
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

    const people = `<div class="detailPeopleBlock"><h3>Reparto principal</h3>${castMarkup(item)}</div>
      <div class="detailPeopleBlock"><h3>Equipo técnico</h3>${crewMarkup(item)}</div>`;
    const upcoming = '<p class="detailUpcomingText">Esta sección se completará en los próximos sprints sin ampliar la ficha principal.</p>';

    content.innerHTML = header + `<div class="detailSections">
      ${section("detail-summary", "Resumen e información", summary, true)}
      ${section("detail-cast", "Reparto y equipo", people, true)}
      ${section("detail-availability", "Disponibilidad", upcoming, false, true)}
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
    const button = event.target.closest("[data-detail-refresh]");
    if (button) refresh(button);
  });

  return { open, render };
})();
