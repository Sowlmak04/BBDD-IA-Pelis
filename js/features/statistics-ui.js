// ---------- Interfaz de estadísticas y recomendaciones ----------
function initStatisticsDashboard() {
  const refresh = document.getElementById("btnStatsRefresh");

  refresh?.addEventListener("click", () => {
    renderStatisticsDashboard();
  });
}

function renderStatisticsDashboard() {
  const root = document.getElementById("statistics-dashboard");
  const updated = document.getElementById("statistics-updated");

  if (!root) return;

  const dashboard = StatisticsService.buildDashboard();

  if (updated) {
    updated.textContent = `Actualizado ${new Intl.DateTimeFormat(
      "es-ES",
      { hour: "2-digit", minute: "2-digit" }
    ).format(new Date(dashboard.generatedAt))}`;
  }

  if (!dashboard.hasData) {
    root.innerHTML = `
      <div class="statsEmpty">
        <strong>Todavía no hay datos suficientes</strong>
        <p>
          Añade películas o series para empezar a generar estadísticas
          y recomendaciones personales.
        </p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    ${renderSummary(dashboard)}
    ${renderActivity(dashboard.monthlyActivity)}
    <div class="statsTwoColumns">
      ${renderRanking(
        "Géneros más vistos",
        dashboard.topGenres,
        "No hay géneros registrados todavía."
      )}
      ${renderRanking(
        "Plataformas más utilizadas",
        dashboard.topPlatforms,
        "No hay plataformas registradas todavía."
      )}
    </div>
    ${renderRecommendations(dashboard)}
    <p class="statsMethodNote">
      Las recomendaciones se calculan en el dispositivo a partir de
      tus géneros, plataformas y valoraciones. No utilizan IA ni envían
      tu biblioteca a servicios externos.
    </p>
  `;
}

function renderSummary(dashboard) {
  const rating = Number.isFinite(dashboard.averageRating)
    ? dashboard.averageRating.toFixed(1).replace(".", ",")
    : "—";

  const watchTime = formatWatchTime(dashboard.totalMinutes);

  return `
    <section class="statsSection" aria-labelledby="stats-summary-title">
      <div class="statsSectionHead">
        <div>
          <span class="statsEyebrow">Tu biblioteca</span>
          <h2 id="stats-summary-title">Resumen general</h2>
        </div>
      </div>

      <div class="statsCards">
        ${statCard(
          dashboard.totals.all,
          "Títulos totales",
          `${dashboard.totals.series} series · ${dashboard.totals.movies} películas`
        )}
        ${statCard(
          dashboard.totals.watched,
          "Ya vistos",
          `${dashboard.totals.pending} pendientes`
        )}
        ${statCard(
          rating,
          "Nota media",
          dashboard.hasWatched
            ? "Media de Adri y Laura"
            : "Añade valoraciones"
        )}
        ${statCard(
          watchTime,
          "Tiempo estimado",
          dashboard.totalMinutes
            ? `${dashboard.durationCoverage.withEstimate} de ${dashboard.durationCoverage.watched} vistos con duración`
            : "Sin duraciones suficientes"
        )}
      </div>
    </section>
  `;
}

function statCard(value, label, detail) {
  return `
    <article class="statsCard">
      <strong class="statsCardValue">${escapeHtml(value)}</strong>
      <span class="statsCardLabel">${escapeHtml(label)}</span>
      <small>${escapeHtml(detail)}</small>
    </article>
  `;
}

function renderActivity(items) {
  const max = Math.max(1, ...items.map(item => item.count));
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return `
    <section class="statsSection" aria-labelledby="stats-activity-title">
      <div class="statsSectionHead">
        <div>
          <span class="statsEyebrow">Últimos 6 meses</span>
          <h2 id="stats-activity-title">Actividad de visionado</h2>
        </div>
        <span class="statsSectionMetric">
          ${total} título${total === 1 ? "" : "s"}
        </span>
      </div>

      <div class="statsBars" role="img"
        aria-label="Títulos vistos por mes durante los últimos seis meses">
        ${items.map(item => `
          <div class="statsBarColumn">
            <span class="statsBarValue">${item.count}</span>
            <div class="statsBarTrack">
              <div
                class="statsBarFill"
                style="height:${Math.max(
                  item.count ? 12 : 2,
                  Math.round((item.count / max) * 100)
                )}%"
              ></div>
            </div>
            <span class="statsBarLabel">${escapeHtml(item.label)}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRanking(title, items, emptyMessage) {
  const max = Math.max(1, ...items.map(item => item.count));

  return `
    <section class="statsSection statsRanking">
      <div class="statsSectionHead">
        <h2>${escapeHtml(title)}</h2>
      </div>

      ${
        items.length
          ? `<div class="statsRankingList">
              ${items.map((item, index) => `
                <div class="statsRankingRow">
                  <span class="statsRankingPosition">${index + 1}</span>
                  <div class="statsRankingMain">
                    <div class="statsRankingLabels">
                      <strong>${escapeHtml(item.label)}</strong>
                      <span>${item.count}</span>
                    </div>
                    <div class="statsRankingTrack">
                      <div
                        class="statsRankingFill"
                        style="width:${Math.round(
                          (item.count / max) * 100
                        )}%"
                      ></div>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>`
          : `<p class="statsNoData">${escapeHtml(emptyMessage)}</p>`
      }
    </section>
  `;
}

function renderRecommendations(dashboard) {
  const recommendations = dashboard.recommendations;

  return `
    <section class="statsSection" aria-labelledby="stats-rec-title">
      <div class="statsSectionHead">
        <div>
          <span class="statsEyebrow">Entre tus pendientes</span>
          <h2 id="stats-rec-title">Qué ver a continuación</h2>
        </div>
      </div>

      ${
        recommendations.length
          ? `<div class="recommendationGrid">
              ${recommendations.map(({ item, reasons }) => `
                <button
                  class="recommendationCard"
                  type="button"
                  data-stats-open-kind="${escapeHtml(item.kind)}"
                  data-stats-open-status="${escapeHtml(item.status)}"
                  data-stats-open-id="${escapeHtml(item.id)}"
                >
                  ${
                    item.posterUrl
                      ? `<img
                          src="${escapeHtml(item.posterUrl)}"
                          alt=""
                          loading="lazy"
                        >`
                      : `<span class="recommendationPosterFallback">
                          Sin imagen
                        </span>`
                  }
                  <span class="recommendationBody">
                    <strong>${escapeHtml(item.title || "Sin título")}</strong>
                    <small>
                      ${escapeHtml([
                        item.year,
                        item.kind === "series" ? "Serie" : "Película"
                      ].filter(Boolean).join(" · "))}
                    </small>
                    <span class="recommendationReasons">
                      ${reasons.map(reason =>
                        `<em>${escapeHtml(reason)}</em>`
                      ).join("")}
                    </span>
                  </span>
                </button>
              `).join("")}
            </div>`
          : `<p class="statsNoData">
              No tienes títulos pendientes para recomendar.
            </p>`
      }
    </section>
  `;
}

function formatWatchTime(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "—";
  }

  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours
      ? `${days} d ${remainingHours} h`
      : `${days} d`;
  }

  if (hours) {
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  return `${minutes} min`;
}

document.addEventListener("click", event => {
  const card = event.target.closest("[data-stats-open-id]");
  if (!card) return;

  const kind = card.dataset.statsOpenKind;
  const status = card.dataset.statsOpenStatus;
  const id = card.dataset.statsOpenId;

  if (!kind || !status || !id) return;

  const targetScreen =
    kind === "series"
      ? status === "vistas"
        ? "series-vistas"
        : "series-pendientes"
      : status === "vistas"
        ? "peliculas-vistas"
        : "peliculas-pendientes";

  setMainTab(kind === "series" ? "series" : "peliculas");
  showScreen(targetScreen);

  window.setTimeout(() => {
    const target = document.querySelector(
      `.itemCard[data-id="${CSS.escape(id)}"]`
    );

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      target.classList.add("itemCardHighlighted");
      window.setTimeout(
        () => target.classList.remove("itemCardHighlighted"),
        1600
      );
    }
  }, 50);
});
