// ---------- Sprint 12.0 · Ficha detallada ----------
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

  function list(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function row(label, value) {
    const text = String(value ?? "").trim();
    return `
      <div class="detailMetaRow">
        <dt>${escape(label)}</dt>
        <dd class="${text ? "" : "detailEmpty"}">${escape(text || "No disponible")}</dd>
      </div>`;
  }

  function section(id, heading, body, open = false, upcoming = false) {
    return `
      <details class="detailSection${upcoming ? " detailSectionUpcoming" : ""}" ${open ? "open" : ""}>
        <summary>
          <span>${escape(heading)}</span>
          ${upcoming ? '<small>Próximamente</small>' : ""}
        </summary>
        <div class="detailSectionBody" id="${escape(id)}">${body}</div>
      </details>`;
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
    const companies = list(item.productionCompanies)
      .map(company => company?.name || "")
      .filter(Boolean)
      .join(", ");
    const synopsis = String(item.synopsis || item.notes || "").trim();

    const header = `
      <article class="detailHero">
        ${item.posterUrl ? `<img src="${escape(item.posterUrl)}" alt="Póster de ${escape(item.title)}" class="detailHeroPoster">` : '<div class="detailHeroPoster detailHeroPosterEmpty">Sin póster</div>'}
        <div class="detailHeroText">
          <p class="detailHeroEyebrow">${escape(context.kind === "series" ? "Serie" : "Película")} · ${escape(context.status === "vistas" ? "Vista" : "Pendiente")}</p>
          <h2>${escape(item.title || "Sin título")}</h2>
          <p>${escape([item.year, item.genre].filter(Boolean).join(" · ") || "Sin metadatos principales")}</p>
          ${item.tmdbId ? `<button class="toolBtn" type="button" data-detail-refresh>Actualizar datos TMDb</button>` : '<p class="detailNoTmdb">Vincula este registro con TMDb desde Editar para completar sus datos.</p>'}
          <div class="detailSyncMessage" data-detail-message aria-live="polite"></div>
        </div>
      </article>`;

    const summary = `
      <div class="detailSynopsis ${synopsis ? "" : "detailEmpty"}">${escape(synopsis || "Sin sinopsis disponible.")}</div>
      <dl class="detailMetaGrid">
        ${row("Duración", item.duration)}
        ${row("Idioma original", item.originalLanguage)}
        ${row("Idiomas hablados", languages)}
        ${row("Países de origen", countries)}
        ${row("Estado de producción", item.productionStatus || item.tmdbStatus)}
        ${row("Productoras", companies)}
      </dl>`;

    const upcoming = '<p class="detailUpcomingText">Esta sección se completará en los próximos sprints sin ampliar la ficha principal.</p>';

    content.innerHTML = header + `
      <div class="detailSections">
        ${section("detail-summary", "Resumen", summary, true)}
        ${section("detail-cast", "Reparto y equipo", upcoming, false, true)}
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
    if (message) message.textContent = "Consultando TMDb…";

    try {
      const details = await TMDbClient.details(item.tmdbId, context.kind);
      const key = keyFromContext(context);
      const items = loadArray(key).map(current =>
        current.id === item.id
          ? { ...current, ...details, updatedAt: Date.now() }
          : current
      );
      saveArray(key, items);
      render();
      const freshMessage = content.querySelector("[data-detail-message]");
      if (freshMessage) freshMessage.textContent = "Datos detallados actualizados correctamente.";
      if (context.kind === "series") {
        context.status === "vistas" ? renderVistas("series") : renderPendientes("series");
      } else {
        context.status === "vistas" ? renderVistas("peliculas") : renderPendientes("peliculas");
      }
    } catch (error) {
      console.error(error);
      button.disabled = false;
      button.textContent = original;
      if (message) {
        message.textContent = error?.message === "TMDB_TOKEN_MISSING"
          ? "Configura el token de TMDb antes de actualizar."
          : "No se pudieron actualizar los datos de TMDb.";
      }
    }
  }

  function open(value) {
    context = {
      ...value,
      returnScreen: value?.returnScreen || "resumen-home"
    };
    render();
    showScreen("ficha-detallada");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function close() {
    showScreen(context?.returnScreen || "resumen-home");
  }

  back?.addEventListener("click", close);
  content?.addEventListener("click", event => {
    const button = event.target.closest("[data-detail-refresh]");
    if (button) refresh(button);
  });

  return { open, render };
})();
