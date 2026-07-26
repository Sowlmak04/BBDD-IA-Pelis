// ---------- Render pendientes ----------
    function renderPendientes(type){
      const isSeries = type === "series";
      const key = isSeries ? KEY.seriesPendientes : KEY.peliculasPendientes;
    
      const listEl  = document.getElementById(isSeries ? "list-series-pendientes" : "list-peliculas-pendientes");
      const emptyEl = document.getElementById(isSeries ? "empty-series-pendientes" : "empty-peliculas-pendientes");
      const countEl = document.getElementById(isSeries ? "count-series-pendientes" : "count-peliculas-pendientes");
    
      const screenName = isSeries ? "series-pendientes" : "peliculas-pendientes";
      const pagerEl = document.getElementById(`pager-${screenName}`);
    
      const items = loadArray(key);
      if (countEl) countEl.textContent = items.length + (items.length === 1 ? " elemento" : " elementos");
    
      // Si no hay items en storage
      if(items.length === 0){
        listEl.innerHTML = "";
        if (emptyEl){
          emptyEl.style.display = "block";
          emptyEl.innerHTML = `No tienes ${isSeries ? "series" : "películas"} pendientes todavía. Ve a <b>Añadir</b> para guardar una.`;
        }
        if(pagerEl){ pagerEl.style.display = "none"; pagerEl.innerHTML = ""; }
        return;
      }
    
      if (emptyEl) emptyEl.style.display = "none";
    
      // ✅ Primero filtrar y ordenar (ANTES de usar "sorted")
      const searched = applySearch(items, screenName);
      const filtered = applyFilter(searched, screenName);
      const sorted = applySort(filtered, screenName);
    
      // Si tras filtrar no hay resultados
      if (sorted.length === 0) {
        listEl.innerHTML = "";
        if (emptyEl){
          emptyEl.style.display = "block";
          emptyEl.innerHTML = `No hay resultados con los filtros actuales.`;
        }
        if(pagerEl){ pagerEl.style.display = "none"; pagerEl.innerHTML = ""; }
        return;
      }
    
      // ✅ paginación: 5 por página
      const { slice } = getPaged(sorted, screenName);
      renderPager(screenName, sorted.length);
    
      listEl.innerHTML = slice.map(item => {
        const meta = [];
        if(item.platform) meta.push(`<span>📺 ${escapeHtml(item.platform)}</span>`);
        if(item.genre) meta.push(`<span>🏷️ ${escapeHtml(item.genre)}</span>`);
        if (item.seasons) meta.push(`<span>📚 ${escapeHtml(item.seasons)} temporadas</span>`);
        if (item.episodes) meta.push(`<span>📄 ${escapeHtml(item.episodes)} capítulos</span>`);
        if(item.duration) meta.push(`<span>⏱️ ${escapeHtml(item.duration)}</span>`);
    
        return `
          <div class="itemCard clickable"
              data-kind="${isSeries ? "series" : "peliculas"}"
              data-id="${escapeHtml(item.id)}"
              role="button" tabindex="0">
            <div class="itemTop">
              <p class="itemTitle">${escapeHtml(item.title)}</p>
            </div>
            ${meta.length ? `<div class="meta">${meta.join("")}</div>` : ``}
          </div>
        `;
      }).join("");
    }
    

    // ---------- Render vistas ----------
    function renderVistas(type){
      const isSeries = type === "series";
      const key = isSeries ? KEY.seriesVistas : KEY.peliculasVistas;
    
      const listEl  = document.getElementById(isSeries ? "list-series-vistas" : "list-peliculas-vistas");
      const emptyEl = document.getElementById(isSeries ? "empty-series-vistas" : "empty-peliculas-vistas");
      const countEl = document.getElementById(isSeries ? "count-series-vistas" : "count-peliculas-vistas");
    
      const screenName = isSeries ? "series-vistas" : "peliculas-vistas";
      const pagerEl = document.getElementById(`pager-${screenName}`);
    
      const items = loadArray(key);
      if (countEl) countEl.textContent = items.length + (items.length === 1 ? " elemento" : " elementos");
    
      // Si no hay items en storage
      if(items.length === 0){
        listEl.innerHTML = "";
        if (emptyEl){
          emptyEl.style.display = "block";
          emptyEl.innerHTML = `No tienes ${isSeries ? "series" : "películas"} vistas todavía. Ve a <b>Añadir</b> para guardar una.`;
        }
        if(pagerEl){ pagerEl.style.display = "none"; pagerEl.innerHTML = ""; }
        return;
      }
    
      if (emptyEl) emptyEl.style.display = "none";
    
      // ✅ Primero filtrar y ordenar (ANTES de usar "sorted")
      const searched = applySearch(items, screenName);
      const filtered = applyFilter(searched, screenName);
      const sorted = applySort(filtered, screenName);
    
      // Si tras filtrar no hay resultados
      if (sorted.length === 0) {
        listEl.innerHTML = "";
        if (emptyEl){
          emptyEl.style.display = "block";
          emptyEl.innerHTML = `No hay resultados con los filtros actuales.`;
        }
        if(pagerEl){ pagerEl.style.display = "none"; pagerEl.innerHTML = ""; }
        return;
      }
    
      const { slice } = getPaged(sorted, screenName);
      renderPager(screenName, sorted.length);
    
      listEl.innerHTML = slice.map(raw => {
        const item = applyLastWatchToView(raw);
        const meta = [];
    
        const ra = Number(item.ratingAdri);
        const rl = Number(item.ratingLaura);
    
        if (Number.isFinite(ra) && Number.isFinite(rl)) {
          const avg = (ra + rl) / 2;
          meta.push(`<span class="metaAvg">⭐ NOTA: ${escapeHtml(formatAvg(avg))}</span>`);
        }
    
        meta.push(`<span>Adri: ${escapeHtml(item.ratingAdri ?? "")}</span>`);
        meta.push(`<span>Laura: ${escapeHtml(item.ratingLaura ?? "")}</span>`);
    
        return `
          <div class="itemCard clickable"
              data-kind="${isSeries ? "series" : "peliculas"}"
              data-status="vistas"
              data-id="${escapeHtml(item.id)}"
              role="button" tabindex="0">
            <div class="itemTop">
              <p class="itemTitle">${escapeHtml(item.title)}</p>
            </div>
            <div class="meta">${meta.join("")}</div>
          </div>
        `;
      }).join("");
    }
