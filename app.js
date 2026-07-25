// ---------- Navegación ----------
    const tabs = Array.from(document.querySelectorAll(".tab"));
    const screens = Array.from(document.querySelectorAll(".screen"));
    
    // ---------- Paginación ----------
    const PAGE_SIZE = 5;

    // Estado de página por pantalla
    const pageState = {
      "series-pendientes": 1,
      "series-vistas": 1,
      "peliculas-pendientes": 1,
      "peliculas-vistas": 1,
    };

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function getPaged(items, screenName) {
      const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      const page = clamp(pageState[screenName] || 1, 1, totalPages);
      pageState[screenName] = page;
  
      const start = (page - 1) * PAGE_SIZE;
      return {
        page,
        totalPages,
        slice: items.slice(start, start + PAGE_SIZE)
      };
    }

    
    function renderPager(screenName, totalItems) {
      const pagerEl = document.getElementById(`pager-${screenName}`);
      if (!pagerEl) return;
      
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      if (totalPages <= 1) {
        pagerEl.style.display = "none";
        pagerEl.innerHTML = "";
        return;
      }
      
      pagerEl.style.display = "flex";
      const page = clamp(pageState[screenName] || 1, 1, totalPages);
      pageState[screenName] = page;
      
      
      const options = [];
      for (let i = 1; i <= totalPages; i++) {
        options.push(`
          <option value="${i}" ${i === page ? "selected" : ""}>
            Página ${i}
          </option>
        `);
      }

      
      pagerEl.innerHTML = `
        <button class="pagerBtn" type="button"
          data-pager-screen="${screenName}" data-pager-page="${page - 1}"
          ${page === 1 ? "disabled" : ""}>
          Anterior
        </button>
    
        <div class="pagerSelectWrap">
          <select class="pagerSelect" data-pager-select="${screenName}" aria-label="Seleccionar página">
            ${options.join("")}
          </select>
        </div>
    
        <button class="pagerBtn" type="button"
          data-pager-screen="${screenName}" data-pager-page="${page + 1}"
          ${page === totalPages ? "disabled" : ""}>
          Siguiente
        </button>
      `;
    }

    // Delegación de eventos para paginación
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pager-screen][data-pager-page]");
      if (!btn) return;
      if (btn.hasAttribute("disabled")) return;
  
      const screenName = btn.dataset.pagerScreen;
      const page = Number(btn.dataset.pagerPage || "1");
      pageState[screenName] = page;
  
      // Re-render según pantalla
      if (screenName === "series-pendientes") renderPendientes("series");
      if (screenName === "peliculas-pendientes") renderPendientes("peliculas");
      if (screenName === "series-vistas") renderVistas("series");
      if (screenName === "peliculas-vistas") renderVistas("peliculas");
    });
    
    
    document.addEventListener("change", (e) => {
      const select = e.target.closest("[data-pager-select]");
      if (!select) return;
      
      const screenName = select.dataset.pagerSelect;
      const page = Number(select.value || "1");
      pageState[screenName] = page;
      
      if (screenName === "series-pendientes") renderPendientes("series");
      if (screenName === "peliculas-pendientes") renderPendientes("peliculas");
      if (screenName === "series-vistas") renderVistas("series");
      if (screenName === "peliculas-vistas") renderVistas("peliculas");
    });
    


    function showScreen(screenName) {
      const exists = screens.some(s => s.dataset.screen === screenName);
      if (!exists) {
        console.warn("Pantalla no encontrada:", screenName);
        return;
      }
      
      // detectar pantalla activa anterior
      const prevScreen = document.querySelector(".screen.active")?.dataset?.screen || null;
      
      // si salimos de una pantalla con estado visual, la limpiamos
      if (prevScreen && prevScreen !== screenName) {
        resetViewState(prevScreen);
      }
      
      // reset a página 1 al entrar en una pantalla paginada
      if (typeof pageState !== "undefined" && pageState && pageState[screenName] != null) {
        pageState[screenName] = 1;
      }
      
      screens.forEach(s => s.classList.toggle("active", s.dataset.screen === screenName));
      
      // refresco de listas cuando entras
      if (screenName === "series-pendientes") renderPendientes("series");
      if (screenName === "peliculas-pendientes") renderPendientes("peliculas");
      if (screenName === "series-vistas") renderVistas("series");
      if (screenName === "peliculas-vistas") renderVistas("peliculas");
      
      updateAllFilterBadges();
      syncAllSearchInputs();
    }
 
    
    
    function setMainTab(main){
      clearEditModeIfAny();
      tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.main === main)));
      if(main === "series")    showScreen("series-home");
      if(main === "peliculas") showScreen("peliculas-home");
      if(main === "anadir")    showScreen("anadir-home");
      history.replaceState(null, "", "#" + main);
    }

    

    

    // ---------- Storage ----------
    const KEY = {
      seriesPendientes: "inv_series_pendientes",
      peliculasPendientes: "inv_peliculas_pendientes",
      seriesVistas: "inv_series_vistas",
      peliculasVistas: "inv_peliculas_vistas",
    };

    function loadArray(key){
      try{
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      }catch{
        return [];
      }
    }

    function saveArray(key, arr){
      localStorage.setItem(key, JSON.stringify(arr));
    }
    
    // ===============================
    // ===== Exportar / Importar =====
    // ===============================
    
    // Qué guardamos en el JSON (datos + preferencias)
    function buildExportObject() {
      return {
        app: "Inventario Series&Películas",
        version: 1,
        exportedAt: Date.now(),
        data: {
          // Listas principales
          [KEY.seriesPendientes]: loadArray(KEY.seriesPendientes),
          [KEY.seriesVistas]: loadArray(KEY.seriesVistas),
          [KEY.peliculasPendientes]: loadArray(KEY.peliculasPendientes),
          [KEY.peliculasVistas]: loadArray(KEY.peliculasVistas),
          
          // Preferencias (orden/filtro/búsqueda)
          SORT_KEY: localStorage.getItem(SORT_KEY) || "{}",
          FILTER_KEY: localStorage.getItem(FILTER_KEY) || "{}",
          SEARCH_KEY: localStorage.getItem(SEARCH_KEY) || "{}",
        }
      };
    }
    
    function downloadJson(obj, filename) {
      const json = JSON.stringify(obj, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      setTimeout(() => URL.revokeObjectURL(url), 800);
    }
    
    async function exportAllData() {
      const obj = buildExportObject();
      
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const stamp = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
      const filename = `inventario_backup_${stamp}.json`;
      
      const json = JSON.stringify(obj, null, 2);
      
      // ✅ iPhone-friendly: hoja de compartir si está disponible
      try {
        const file = new File([json], filename, { type: "application/json" });
        
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          await navigator.share({
            title: "Backup Inventario",
            text: "Backup JSON del inventario",
            files: [file],
          });
          showToast("Exportado ✓");
          return;
        }
      } catch (e) {
        // Si falla share, caemos al método clásico
      }
      
      // Fallback: descarga normal
      downloadJson(obj, filename);
      showToast("Exportado ✓ (mira Archivos/Descargas)");
    }
    
    function parseImportJson(text) {
      const cleaned = String(text || "").replace(/^\uFEFF/, "").trim();
      
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        throw new Error("No se pudo parsear el JSON (archivo corrupto o no es JSON válido).");
      }
      
      if (!parsed || typeof parsed !== "object") {
        throw new Error("JSON inválido.");
      }
      
      // Permitimos formatos:
      // A) { data: { ... } }  (nuevo)
      // B) { ... }            (legacy)
      const data = (parsed.data && typeof parsed.data === "object") ? parsed.data : parsed;
      
      if (!data || typeof data !== "object") {
        throw new Error("Este JSON no tiene la estructura esperada.");
      }
      
      // devolvemos SIEMPRE { raw, data }
      return { raw: parsed, data };
    }
    
    
    function importReplaceAll(parsedWrap) {
      const data = parsedWrap?.data || parsedWrap; // soporta llamada antigua
      
      // Helpers
      const pickArray = (obj, keyList) => {
        for (const k of keyList) {
          if (Array.isArray(obj?.[k])) return obj[k];
        }
        return null;
      };
      
      // 1) Detectar listas en formato NUEVO o LEGACY
      // Nuevo (tu app actual): claves storage reales
      const spNew = pickArray(data, [KEY.seriesPendientes]);
      const svNew = pickArray(data, [KEY.seriesVistas]);
      const ppNew = pickArray(data, [KEY.peliculasPendientes]);
      const pvNew = pickArray(data, [KEY.peliculasVistas]);
      
      // Legacy comunes (por si exportaste antes con nombres “humanos”)
      const spOld = pickArray(data, ["seriesPendientes", "series_pendientes", "sp"]);
      const svOld = pickArray(data, ["seriesVistas", "series_vistas", "sv"]);
      const ppOld = pickArray(data, ["peliculasPendientes", "peliculas_pendientes", "pp", "moviesPendientes"]);
      const pvOld = pickArray(data, ["peliculasVistas", "peliculas_vistas", "pv", "moviesVistas"]);
      
      const sp = spNew ?? spOld ?? [];
      const sv = svNew ?? svOld ?? [];
      const pp = ppNew ?? ppOld ?? [];
      const pv = pvNew ?? pvOld ?? [];
      
      // Si NO ha encontrado nada en ningún formato, lo decimos claro (no “importación fantasma”)
      const foundAny =
        (spNew || svNew || ppNew || pvNew || spOld || svOld || ppOld || pvOld);
      
      if (!foundAny) {
        throw new Error(
          "El JSON no contiene listas compatibles. " +
          "Asegúrate de importar un archivo exportado desde esta app."
        );
      }
      
      // 2) Reemplazar datos
      saveArray(KEY.seriesPendientes, sp);
      saveArray(KEY.seriesVistas, sv);
      saveArray(KEY.peliculasPendientes, pp);
      saveArray(KEY.peliculasVistas, pv);
      
      // 3) Preferencias: aceptamos tu formato actual (propiedades SORT_KEY/FILTER_KEY/SEARCH_KEY)
      // y también el formato “directo” por si alguna vez lo guardaste así.
      const sortStr = (typeof data?.SORT_KEY === "string") ? data.SORT_KEY : localStorage.getItem(SORT_KEY) || "{}";
      const filterStr = (typeof data?.FILTER_KEY === "string") ? data.FILTER_KEY : localStorage.getItem(FILTER_KEY) || "{}";
      const searchStr = (typeof data?.SEARCH_KEY === "string") ? data.SEARCH_KEY : localStorage.getItem(SEARCH_KEY) || "{}";
      
      if (typeof data?.SORT_KEY === "string") localStorage.setItem(SORT_KEY, sortStr);
      if (typeof data?.FILTER_KEY === "string") localStorage.setItem(FILTER_KEY, filterStr);
      if (typeof data?.SEARCH_KEY === "string") localStorage.setItem(SEARCH_KEY, searchStr);
      
      // 4) Modo REEMPLAZAR: quitamos búsqueda/filtros para que NO parezca vacío
      try {
        localStorage.removeItem(SEARCH_KEY);
        localStorage.removeItem(FILTER_KEY);
      } catch (e) {}
      
      // 5) IMPORTANTÍSIMO: resync estados en memoria (si no, se quedan “viejos”)
      try { sortState = JSON.parse(localStorage.getItem(SORT_KEY) || "{}"); } catch (e) { sortState = {}; }
      try { filterState = JSON.parse(localStorage.getItem(FILTER_KEY) || "{}"); } catch (e) { filterState = {}; }
      try { searchState = JSON.parse(localStorage.getItem(SEARCH_KEY) || "{}"); } catch (e) { searchState = {}; }
      
      // 6) Reset paginación
      try {
        if (typeof pageState === "object" && pageState) {
          Object.keys(pageState).forEach(k => pageState[k] = 1);
        }
      } catch (e) {}
      
      // 7) Migraciones + UI
      migrateWatchLog();
      updateAllFilterBadges();
      syncAllSearchInputs();
      
      // 8) Repintar la pantalla ACTIVA (y por seguridad, las 4 listas)
      const activeScreen = document.querySelector(".screen.active")?.dataset?.screen || null;
      
      renderPendientes("series");
      renderPendientes("peliculas");
      renderVistas("series");
      renderVistas("peliculas");
      
      if (activeScreen) showScreen(activeScreen);
      
      showToast("Importado ✓");
    }
    
    
    function importMergeAll(parsedWrap) {
      const data = parsedWrap?.data || parsedWrap;
      
      const pickArray = (obj, keyList) => {
        for (const k of keyList) {
          if (Array.isArray(obj?.[k])) return obj[k];
        }
        return null;
      };
      
      // Importado: formato nuevo o legacy
      const spImported = pickArray(data, [KEY.seriesPendientes, "seriesPendientes", "series_pendientes", "sp"]) || [];
      const svImported = pickArray(data, [KEY.seriesVistas, "seriesVistas", "series_vistas", "sv"]) || [];
      const ppImported = pickArray(data, [KEY.peliculasPendientes, "peliculasPendientes", "peliculas_pendientes", "pp", "moviesPendientes"]) || [];
      const pvImported = pickArray(data, [KEY.peliculasVistas, "peliculasVistas", "peliculas_vistas", "pv", "moviesVistas"]) || [];
      
      const normalize = (v) => (v || "").toString().trim().toLocaleLowerCase("es");
      
      const dedupeMerged = (currentArr, importedArr, kind) => {
        const byId = new Map();
        
        // 1) meter actuales
        currentArr.forEach(item => {
          if (item?.id) byId.set(item.id, item);
          else byId.set(`noid_current_${Math.random()}`, item);
        });
        
        // 2) importar: si coincide id, gana el importado
        importedArr.forEach(item => {
          if (item?.id && byId.has(item.id)) {
            byId.set(item.id, item);
          } else if (item?.id) {
            byId.set(item.id, item);
          } else {
            byId.set(`noid_import_${Math.random()}`, item);
          }
        });
        
        // 3) dedupe lógico por tipo + title + platform
        const logical = new Map();
        
        [...byId.values()].forEach(item => {
          const title = normalize(item?.title);
          const platform = normalize(item?.platform);
          const logicalKey = `${kind}__${title}__${platform}`;
          
          if (!logical.has(logicalKey)) {
            logical.set(logicalKey, item);
            return;
          }
          
          const existing = logical.get(logicalKey);
          
          // regla simple: nos quedamos con el más "completo"
          const score = (x) => {
            let s = 0;
            if (x?.genre) s += 1;
            if (x?.duration) s += 1;
            if (x?.synopsis) s += 1;
            if (x?.notes) s += 1;
            if (x?.notesAdri) s += 1;
            if (x?.notesLaura) s += 1;
            if (x?.seasons) s += 1;
            if (x?.episodes) s += 1;
            if (Array.isArray(x?.watchLog)) s += x.watchLog.length * 2;
            if (x?.ratingAdri != null && x?.ratingAdri !== "") s += 2;
            if (x?.ratingLaura != null && x?.ratingLaura !== "") s += 2;
            return s;
          };
          
          const existingScore = score(existing);
          const candidateScore = score(item);
          
          if (candidateScore > existingScore) {
            logical.set(logicalKey, item);
          } else if (candidateScore === existingScore) {
            const existingDate = Number(existing?.updatedAt || existing?.createdAt || 0);
            const candidateDate = Number(item?.updatedAt || item?.createdAt || 0);
            if (candidateDate > existingDate) {
              logical.set(logicalKey, item);
            }
          }
        });
        
        return [...logical.values()];
      };
      
      const spCurrent = loadArray(KEY.seriesPendientes);
      const svCurrent = loadArray(KEY.seriesVistas);
      const ppCurrent = loadArray(KEY.peliculasPendientes);
      const pvCurrent = loadArray(KEY.peliculasVistas);
      
      const spFinal = dedupeMerged(spCurrent, spImported, "series-pendientes");
      const svFinal = dedupeMerged(svCurrent, svImported, "series-vistas");
      const ppFinal = dedupeMerged(ppCurrent, ppImported, "peliculas-pendientes");
      const pvFinal = dedupeMerged(pvCurrent, pvImported, "peliculas-vistas");
      
      saveArray(KEY.seriesPendientes, spFinal);
      saveArray(KEY.seriesVistas, svFinal);
      saveArray(KEY.peliculasPendientes, ppFinal);
      saveArray(KEY.peliculasVistas, pvFinal);
      
      // Preferencias: NO las pisamos en mezclar
      try {
        if (typeof pageState === "object" && pageState) {
          Object.keys(pageState).forEach(k => pageState[k] = 1);
        }
      } catch (e) {}
      
      migrateWatchLog();
      updateAllFilterBadges();
      syncAllSearchInputs();
      
      renderPendientes("series");
      renderPendientes("peliculas");
      renderVistas("series");
      renderVistas("peliculas");
      
      const activeScreen = document.querySelector(".screen.active")?.dataset?.screen || null;
      if (activeScreen) showScreen(activeScreen);
      
      showToast("Importado y mezclado ✓");
    }
    
    
    function newId(){
      return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8);
    }

    function escapeHtml(str){
      return String(str)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
    }

    function setMsg(el, text, type){
      el.textContent = text || "";
      el.className = "msg" + (type ? " " + type : "");
      if(type === "ok"){
        setTimeout(() => { el.textContent=""; el.className="msg"; }, 1600);
      }
    }
    
    
    function formatAvg(n) {
      const v = Math.round(Number(n) * 100) / 100; // 2 decimales reales
      let s = v.toFixed(2); // "9.75"
      s = s.replace(/\.?0+$/, ""); // "9.75" / "9.5" / "10"
      return s.replace(".", ","); // "9,75"
    }
    
    
    // ---------- WatchLog (historial de visionados) ----------
    function makeWatchEntry({ ratingAdri, ratingLaura, notesAdri, notesLaura, at }) {
      return {
        at: at || Date.now(),
        ratingAdri: Number(ratingAdri),
        ratingLaura: Number(ratingLaura),
        notesAdri: (notesAdri || "").toString().trim(),
        notesLaura: (notesLaura || "").toString().trim(),
      };
    }

    // Garantiza que item.watchLog exista y sea un array.
    // Si no existe pero el item tiene rating/notes, crea una entrada inicial.
    function ensureWatchLog(item) {
      if (!item || typeof item !== "object") return item;
  
      if (Array.isArray(item.watchLog)) return item;
  
      const hasRatings =
        (item.ratingAdri != null && item.ratingAdri !== "") ||
        (item.ratingLaura != null && item.ratingLaura !== "") ||
        (item.notesAdri != null && item.notesAdri !== "") ||
        (item.notesLaura != null && item.notesLaura !== "");
  
      const entryAt = item.watchedAt || item.createdAt || Date.now();
  
      return {
        ...item,
        watchLog: hasRatings ?
          [makeWatchEntry({
            ratingAdri: item.ratingAdri ?? "",
            ratingLaura: item.ratingLaura ?? "",
            notesAdri: item.notesAdri ?? "",
            notesLaura: item.notesLaura ?? "",
            at: entryAt
          })] :
          []
      };
    }

    // Migración: añade watchLog en VISTAS (series + películas) si falta
    function migrateWatchLog() {
      const keys = [KEY.seriesVistas, KEY.peliculasVistas];
  
      keys.forEach(k => {
        const arr = loadArray(k);
        let changed = false;
    
        const next = arr.map(it => {
          if (Array.isArray(it?.watchLog)) return it;
          changed = true;
          return ensureWatchLog(it);
        });
    
        if (changed) saveArray(k, next);
      });
    }
    
    
    function getLastWatch(item) {
      const base = ensureWatchLog(item);
      const log = Array.isArray(base.watchLog) ? base.watchLog : [];
      const last = log.length ? log[log.length - 1] : null;
  
      // Fallback legacy si no hay log
      if (!last) {
        const ra = (base.ratingAdri ?? "");
        const rl = (base.ratingLaura ?? "");
        const na = (base.notesAdri ?? "");
        const nl = (base.notesLaura ?? "");
        const hasAnything = (ra !== "" || rl !== "" || na !== "" || nl !== "");
        return hasAnything ? { at: base.watchedAt || base.createdAt || Date.now(), ratingAdri: ra, ratingLaura: rl, notesAdri: na, notesLaura: nl } : null;
      }
      return last;
    }

    function applyLastWatchToView(item) {
      const last = getLastWatch(item);
      if (!last) return item;
  
      // Para UI: garantizamos que rating/notes reflejen el último visionado
      return {
        ...item,
        ratingAdri: last.ratingAdri,
        ratingLaura: last.ratingLaura,
        notesAdri: last.notesAdri,
        notesLaura: last.notesLaura,
        watchedAt: last.at
      };
    }
    
    
    // ===== Ordenar (estado + modal) =====
    const SORT_KEY = "inv_sort_state_v1";
    let sortState = {};
    try { sortState = JSON.parse(localStorage.getItem(SORT_KEY) || "{}"); } catch(e){ sortState = {}; }

    const sortOverlay = document.getElementById("sortOverlay");
    const sortClose   = document.getElementById("sortClose");
    const sortCancel  = document.getElementById("sortCancel");
    const sortApply   = document.getElementById("sortApply");

    let currentSortScope = null;
    let pendingSortMode = "az";

    
    function getSortMode(scope) {
      return sortState?.[scope] || "az";
    }
    
    function setSortMode(scope, mode){
      sortState[scope] = mode;
      localStorage.setItem(SORT_KEY, JSON.stringify(sortState));
    }

    
    function openSortModal(scope) {
      currentSortScope = scope;
      pendingSortMode = getSortMode(scope);
      
      const isVistas = (scope === "series-vistas" || scope === "peliculas-vistas");
      
      // Mostrar/ocultar opciones de puntuación
      sortOverlay.querySelectorAll(".sortRatingOption").forEach(el => {
        el.style.display = isVistas ? "flex" : "none";
      });
      
      // Si estamos en pendientes y había quedado guardado un sort de puntuación, volvemos a recent
      if (!isVistas && (pendingSortMode === "rating_desc" || pendingSortMode === "rating_asc")) {
        pendingSortMode = "az";
      }
      
      // marcar radio actual
      sortOverlay.querySelectorAll('input[name="sortMode"]').forEach(r => {
        r.checked = (r.value === pendingSortMode);
      });
      
      sortOverlay.classList.add("open");
      sortOverlay.setAttribute("aria-hidden", "false");
      syncBodyModalOpen();
    }


    function closeSortModal(){
      sortOverlay.classList.remove("open");
      sortOverlay.setAttribute("aria-hidden", "true");
      syncBodyModalOpen();
      currentSortScope = null;
    }

    sortOverlay.addEventListener("click", (e) => {
      if (e.target === sortOverlay) closeSortModal();
    });
    sortClose.addEventListener("click", closeSortModal);
    sortCancel.addEventListener("click", closeSortModal);

    sortOverlay.querySelectorAll('input[name="sortMode"]').forEach(r => {
      r.addEventListener("change", () => pendingSortMode = r.value);
    });

    
    sortApply.addEventListener("click", () => {
      if (!currentSortScope) return;
  
      const scope = currentSortScope;
      setSortMode(scope, pendingSortMode);
  
      // ✅ Volver siempre a la página 1 al cambiar orden
      if (typeof pageState === "object" && pageState[scope] != null) {
        pageState[scope] = 1;
      }
  
      closeSortModal();
      refreshScope(scope);
    });
    
    
    // Aplica el orden a un array de items (NO muta el original)
    function applySort(items, scope) {
      const mode = getSortMode(scope);
      const arr = [...items];
      
      const titleA = (x) => (x?.title || "").toString().trim().toLocaleLowerCase("es");
      const dateA = (x) => {
        // En pendientes: lo más reciente incluye "volver a ver"
        if ((scope || "").endsWith("pendientes")) return Number(x?.movedBackAt || x?.createdAt || 0);
        return Number(x?.createdAt || 0);
      };
      
      const avgRating = (x) => {
        const item = applyLastWatchToView(x);
        const ra = Number(item?.ratingAdri);
        const rl = Number(item?.ratingLaura);
        
        if (Number.isFinite(ra) && Number.isFinite(rl)) return (ra + rl) / 2;
        if (Number.isFinite(ra)) return ra;
        if (Number.isFinite(rl)) return rl;
        return -1;
      };
      
      if (mode === "az") {
        arr.sort((a, b) =>
          titleA(a).localeCompare(titleA(b), "es", { sensitivity: "base" }) ||
          (dateA(b) - dateA(a))
        );
      } else if (mode === "za") {
        arr.sort((a, b) =>
          titleA(b).localeCompare(titleA(a), "es", { sensitivity: "base" }) ||
          (dateA(b) - dateA(a))
        );
      } else if (mode === "old") {
        arr.sort((a, b) =>
          (dateA(a) - dateA(b)) ||
          titleA(a).localeCompare(titleA(b), "es", { sensitivity: "base" })
        );
      } else if (mode === "rating_desc") {
        arr.sort((a, b) =>
          (avgRating(b) - avgRating(a)) ||
          titleA(a).localeCompare(titleA(b), "es", { sensitivity: "base" })
        );
      } else if (mode === "rating_asc") {
        arr.sort((a, b) =>
          (avgRating(a) - avgRating(b)) ||
          titleA(a).localeCompare(titleA(b), "es", { sensitivity: "base" })
        );
      } else if (mode === "recent") {
        arr.sort((a, b) =>
          (dateA(b) - dateA(a)) ||
          titleA(a).localeCompare(titleA(b), "es", { sensitivity: "base" })
        );
      } else { // "az" por defecto
        arr.sort((a, b) =>
          titleA(a).localeCompare(titleA(b), "es", { sensitivity: "base" }) ||
          (dateA(b) - dateA(a))
        );
      }
      
      return arr;
    }


    // Re-render según scope
    function refreshScope(scope){
      switch(scope){
        case "series-pendientes":    return renderPendientes("series");
        case "peliculas-pendientes": return renderPendientes("peliculas");
        case "series-vistas":        return renderVistas("series");
        case "peliculas-vistas":     return renderVistas("peliculas");
        default:
          return;
      }
    }
    
    function resetViewState(scope) {
      if (!scope) return;
      
      // reset orden
      if (sortState && typeof sortState === "object") {
        delete sortState[scope];
        localStorage.setItem(SORT_KEY, JSON.stringify(sortState));
      }
      
      // reset filtros
      if (filterState && typeof filterState === "object") {
        delete filterState[scope];
        localStorage.setItem(FILTER_KEY, JSON.stringify(filterState));
      }
      
      // reset búsqueda
      if (searchState && typeof searchState === "object") {
        delete searchState[scope];
        localStorage.setItem(SEARCH_KEY, JSON.stringify(searchState));
      }
      
      // reset página
      if (typeof pageState === "object" && pageState[scope] != null) {
        pageState[scope] = 1;
      }
      
      // cerrar buscador visual si estuviera abierto
      const box = document.querySelector(`.searchBox[data-search-box="${scope}"]`);
      if (box) box.classList.remove("open");
      
      const screen = document.querySelector(`.screen[data-screen="${scope}"]`);
      if (screen) screen.classList.remove("searchOpen");
    }

    
    // ===== Filtrar (estado + modal) =====
    const FILTER_KEY = "inv_filter_state_v1";
    let filterState = {};
    try { filterState = JSON.parse(localStorage.getItem(FILTER_KEY) || "{}"); } catch(e){ filterState = {}; }

    const filterOverlay   = document.getElementById("filterOverlay");
    const filterClose     = document.getElementById("filterClose");
    const filterCancel    = document.getElementById("filterCancel");
    const filterClear     = document.getElementById("filterClear");
    const filterApply     = document.getElementById("filterApply");
    const filterPlatforms = document.getElementById("filterPlatforms");
    const filterGenres    = document.getElementById("filterGenres");

    let currentFilterScope = null;
    let pendingFilter = { platforms: [], genres: [] };

    function getFilter(scope){
      const f = filterState?.[scope];
      return {
        platforms: Array.isArray(f?.platforms) ? f.platforms : [],
        genres: Array.isArray(f?.genres) ? f.genres : [],
      };
    }

    function setFilter(scope, filter){
      filterState[scope] = {
        platforms: Array.isArray(filter?.platforms) ? filter.platforms : [],
        genres: Array.isArray(filter?.genres) ? filter.genres : [],
      };
      localStorage.setItem(FILTER_KEY, JSON.stringify(filterState));
    }

    function readChecked(containerEl){
      if (!containerEl) return [];
      return [...containerEl.querySelectorAll('input[type="checkbox"]:checked')]
        .map(i => (i.value || "").toString())
        .filter(Boolean);
    }

    function renderFilterGroup(containerEl, values, selected){
      if (!containerEl) return;

      if (!values.length){
        containerEl.innerHTML = `<div class="empty" style="margin-top:0;">No hay opciones disponibles.</div>`;
        return;
      }

      containerEl.innerHTML = values.map(v => `
        <label class="optRow">
          <input type="checkbox" value="${escapeHtml(v)}" ${selected.includes(v) ? "checked" : ""}>
          <span>${escapeHtml(v)}</span>
        </label>
      `).join("");
    }

    function getItemsForScope(scope){
      // OJO: aquí no aplicamos sort/filter, solo cogemos el origen para sacar opciones
      switch(scope){
        case "series-pendientes":    return loadArray(KEY.seriesPendientes);
        case "peliculas-pendientes": return loadArray(KEY.peliculasPendientes);
        case "series-vistas":        return loadArray(KEY.seriesVistas);
        case "peliculas-vistas":     return loadArray(KEY.peliculasVistas);
        default: return [];
      }
    }

    function openFilterModal(scope){
      currentFilterScope = scope;
      pendingFilter = getFilter(scope);

      const items = getItemsForScope(scope);

      const platforms = [...new Set(items.map(x => (x?.platform || "").toString().trim()).filter(Boolean))]
        .sort((a,b) => a.localeCompare(b, "es", { sensitivity:"base" }));

      const genres = [...new Set(items.map(x => (x?.genre || "").toString().trim()).filter(Boolean))]
        .sort((a,b) => a.localeCompare(b, "es", { sensitivity:"base" }));

      renderFilterGroup(filterPlatforms, platforms, pendingFilter.platforms);
      renderFilterGroup(filterGenres, genres, pendingFilter.genres);

      filterOverlay.classList.add("open");
      filterOverlay.setAttribute("aria-hidden", "false");
      syncBodyModalOpen();
    }

    function closeFilterModal(){
      filterOverlay.classList.remove("open");
      filterOverlay.setAttribute("aria-hidden", "true");
      syncBodyModalOpen();
      currentFilterScope = null;
      updateAllFilterBadges();
    }
    

    filterOverlay.addEventListener("click", (e) => {
      if (e.target === filterOverlay) closeFilterModal();
    });
    filterClose.addEventListener("click", closeFilterModal);
    filterCancel.addEventListener("click", closeFilterModal);

    filterClear.addEventListener("click", () => {
      if (!filterPlatforms || !filterGenres) return;
      filterPlatforms.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
      filterGenres.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    });

    filterApply.addEventListener("click", () => {
      if (!currentFilterScope) return;
    
      const scope = currentFilterScope;
    
      const next = {
        platforms: readChecked(filterPlatforms),
        genres: readChecked(filterGenres),
      };
    
      setFilter(scope, next);
      updateFilterBadge(scope);
    
      // ✅ al filtrar, volver a página 1
      if (typeof pageState === "object" && pageState[scope] != null) {
        pageState[scope] = 1;
      }
    
      closeFilterModal();
      refreshScope(scope);
    });

    // Aplica filtros a un array de items (NO muta el original)
    function applyFilter(items, scope){
      const f = getFilter(scope);
      const platforms = f.platforms || [];
      const genres = f.genres || [];

      let arr = [...items];

      if (platforms.length){
        arr = arr.filter(x => platforms.includes((x?.platform || "").toString().trim()));
      }
      if (genres.length){
        arr = arr.filter(x => genres.includes((x?.genre || "").toString().trim()));
      }
      return arr;
    }
    
    // ===== Badge "Filtrar" activo =====
    function hasActiveFilters(scope) {
      const f = getFilter(scope);
      return (Array.isArray(f.platforms) && f.platforms.length > 0) ||
        (Array.isArray(f.genres) && f.genres.length > 0);
    }
    
    function updateFilterBadge(scope) {
      const btn = document.querySelector(`button.toolBtn[data-action="filter"][data-scope="${scope}"]`);
      if (!btn) return;
      btn.classList.toggle("hasBadge", hasActiveFilters(scope));
    }
    
    function updateAllFilterBadges() {
      ["series-pendientes", "series-vistas", "peliculas-pendientes", "peliculas-vistas"].forEach(updateFilterBadge);
    }
    
    
    // ===== Buscar por título (estado + lógica) =====
    const SEARCH_KEY = "inv_search_state_v1";
    let searchState = {};
    try { searchState = JSON.parse(localStorage.getItem(SEARCH_KEY) || "{}"); } catch(e){ searchState = {}; }
    
    function getSearch(scope){
      return (searchState?.[scope] || "").toString();
    }
    function setSearch(scope, value){
      searchState[scope] = (value || "").toString();
      localStorage.setItem(SEARCH_KEY, JSON.stringify(searchState));
    }
    
    function applySearch(items, scope){
      const q = getSearch(scope).trim().toLocaleLowerCase("es");
      if (!q) return [...items];
      return [...items].filter(x => ((x?.title || "").toString().toLocaleLowerCase("es")).includes(q));
    }
    
    function syncSearchInput(scope){
      const input = document.querySelector(`input.searchInput[data-search="${scope}"]`);
      const clearBtn = document.querySelector(`button.searchClear[data-search-clear="${scope}"]`);
      if (!input) return;
    
      const v = getSearch(scope);
      input.value = v;
      if (clearBtn) clearBtn.style.display = v.trim() ? "inline-flex" : "none";
    }
    
    function syncAllSearchInputs(){
      ["series-pendientes","series-vistas","peliculas-pendientes","peliculas-vistas"].forEach(syncSearchInput);
    }
    
    // Input (delegado)
    document.addEventListener("input", (e) => {
      const inp = e.target.closest("input.searchInput[data-search]");
      if (!inp) return;
    
      const scope = inp.dataset.search;
      setSearch(scope, inp.value);
    
      // volver a página 1 al buscar
      if (typeof pageState === "object" && pageState[scope] != null) pageState[scope] = 1;
    
      syncSearchInput(scope);
      refreshScope(scope);
    });
    
    // Clear (delegado)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button.searchClear[data-search-clear]");
      if (!btn) return;
    
      const scope = btn.dataset.searchClear;
      setSearch(scope, "");
    
      if (typeof pageState === "object" && pageState[scope] != null) pageState[scope] = 1;
    
      syncSearchInput(scope);
      refreshScope(scope);
    });
    
    
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
        
    
    
    // ---------- Modal detalle (pendientes + vistas) ----------
    const detailOverlay = document.getElementById("detailOverlay");
    const detailClose = document.getElementById("detailClose");
    const detailTitle = document.getElementById("detailTitle");
    const detailBody = document.getElementById("detailBody");
    
    // Estado del detalle abierto (para acciones tipo eliminar)
    let currentDetail = { kind: null, id: null, status: null, listKey: null, returnScreen: null };
    
    let editMode = { active: false, kind: null, id: null, returnScreen: null };

    function setFormEditUI(form, screenName, labelText) {
      const screen = document.querySelector(`.screen[data-screen="${screenName}"]`);
      const pill = screen?.querySelector(".backRow .pill");
      if (pill) pill.textContent = labelText;
  
      const saveBtn = form.querySelector(".btnPrimary");
      if (saveBtn) saveBtn.textContent = "Guardar cambios";
    }

    function resetFormEditUI(form, screenName, defaultPillText) {
      const screen = document.querySelector(`.screen[data-screen="${screenName}"]`);
      const pill = screen?.querySelector(".backRow .pill");
      if (pill) pill.textContent = defaultPillText;
  
      const saveBtn = form.querySelector(".btnPrimary");
      if (saveBtn) saveBtn.textContent = "Guardar";
    }

    
    function startEditFromDetail() {
      const { kind, id, returnScreen, status, listKey } = currentDetail;
      if (!kind || !id) return;
  
      const isSeries = kind === "series";
      const isVistas = status === "vistas";
  
      const key = listKey || (
        isSeries ?
        (isVistas ? KEY.seriesVistas : KEY.seriesPendientes) :
        (isVistas ? KEY.peliculasVistas : KEY.peliculasPendientes)
      );
  
      const items = loadArray(key);
      let item = items.find(x => x.id === id);
      if (!item) return;
  
      // ✅ Siempre aseguramos estructura
      item = ensureWatchLog(item);
  
      // Si es vistas, la edición debe basarse en el ÚLTIMO visionado
      if (isVistas) {
        item = applyLastWatchToView(item);
      }   
  
      // Elegir pantalla + form según tipo y estado
      const screenName = isSeries ?
        (isVistas ? "anadir-series-vistas" : "anadir-series-pendientes") :
        (isVistas ? "anadir-peliculas-vistas" : "anadir-peliculas-pendientes");
  
      const form = isSeries ?
        (isVistas ? formSV : formSP) :
        (isVistas ? formPV : formPP);
  
      // Marcar modo edición
      editMode = { active: true, kind, id, returnScreen };
      form.dataset.editId = id;
      form.dataset.editKind = kind;
      form.dataset.returnScreen = returnScreen;
  
      // Prefill campos comunes
      form.querySelector('input[name="title"]').value = item.title || "";
      form.querySelector('input[name="platform"]').value = item.platform || "";
      form.querySelector('input[name="genre"]').value = item.genre || "";
      form.querySelector('input[name="duration"]').value = item.duration || "";
  
      // Series: temporadas / capítulos
      const sField = form.querySelector('input[name="seasons"]');
      if (sField) sField.value = item.seasons ?? "";
  
      const eField = form.querySelector('input[name="episodes"]');
      if (eField) eField.value = item.episodes ?? "";
  
      // Pendientes: sinopsis
      const synField = form.querySelector('textarea[name="synopsis"]');
      if (synField) synField.value = (item.synopsis || item.notes || "");
  
      // Vistas: notas + estrellas desde último watchLog
      if (isVistas) {
        const notesA = form.querySelector('textarea[name="notesAdri"]');
        if (notesA) notesA.value = item.notesAdri || "";
    
        const notesL = form.querySelector('textarea[name="notesLaura"]');
        if (notesL) notesL.value = item.notesLaura || "";
    
        // Set estrellas usando el widget
        form.querySelectorAll('[data-widget="rating"]').forEach(w => {
          const target = w.dataset.target;
          if (!target) return;
      
          if (target.includes("rating-adri") && typeof w._setRating === "function") {
            w._setRating(item.ratingAdri);
          }
      
          if (target.includes("rating-laura") && typeof w._setRating === "function") {
            w._setRating(item.ratingLaura);
          }
        });
      }
  
      // Cambiar botón volver para regresar a la lista
      const backBtn = form.querySelector('.backBtn[type="button"][data-screen]');
      if (backBtn) {
        backBtn.dataset.prevScreen = backBtn.dataset.screen;
        backBtn.dataset.screen = returnScreen;
      }
  
      // Actualizar UI del formulario
      const label = isVistas ?
        (isSeries ? "Editar · Serie vista" : "Editar · Película vista") :
        (isSeries ? "Editar · Serie pendiente" : "Editar · Película pendiente");
  
      setFormEditUI(form, screenName, label);
  
      closeDetailModal();
      showScreen(screenName);
    }
    
    
    function clearEditModeIfAny() {
      if (!editMode.active) return;
  
      const isSeries = editMode.kind === "series";
      const isVistas =
        editMode.returnScreen === "series-vistas" ||
        editMode.returnScreen === "peliculas-vistas";
  
      const screenName = isSeries ?
        (isVistas ? "anadir-series-vistas" : "anadir-series-pendientes") :
        (isVistas ? "anadir-peliculas-vistas" : "anadir-peliculas-pendientes");
  
      const form = isSeries ?
        (isVistas ? formSV : formSP) :
        (isVistas ? formPV : formPP);
  
      // Restaurar botón volver
      const backBtn = form.querySelector('.backBtn[type="button"][data-screen]');
      if (backBtn && backBtn.dataset.prevScreen) {
        backBtn.dataset.screen = backBtn.dataset.prevScreen;
        delete backBtn.dataset.prevScreen;
      }
  
      // Restaurar UI (pill + texto botón)
      resetFormEditUI(
        form,
        screenName,
        isVistas ?
        (isSeries ? "Formulario · Serie vista" : "Formulario · Película vista") :
        (isSeries ? "Formulario · Serie pendiente" : "Formulario · Película pendiente")
      );
  
      // Limpiar estado dataset
      delete form.dataset.editId;
      delete form.dataset.editKind;
      delete form.dataset.returnScreen;
  
      editMode = { active: false, kind: null, id: null, returnScreen: null };
    }
    
    
    
    function renderDetailAsForm(item, { isSeries, isVistas }) {
      const rows = [];
  
      const field = (label, value) => `
        <div class="field">
          <label>${escapeHtml(label)}</label>
          <input value="${escapeHtml(value ?? "")}" readonly />
        </div>
      `;
  
      const area = (label, value) => `
        <div class="field" style="grid-column:1/-1;">
          <label>${escapeHtml(label)}</label>
          <textarea readonly>${escapeHtml(value ?? "")}</textarea>
        </div>
      `;
  
      // --- TÍTULO ---
      rows.push(field("Título", item.title || ""));
  
      const synopsis = (item.synopsis || item.notes || "").toString().trim();
  
      // ✅ PENDIENTES: Sinopsis justo debajo del título (siempre visible)
      if (!isVistas && synopsis) {
        rows.push(area("Sinopsis", synopsis));
      }
  
      // --- VISTAS: valoraciones + sinopsis + notas justo tras título ---
      if (isVistas) {
        rows.push(field("Valoración Adri", item.ratingAdri ?? ""));
        rows.push(field("Valoración Laura", item.ratingLaura ?? ""));
    
        // Sinopsis siempre visible (en vistas va aquí)
        rows.push(area("Sinopsis", synopsis));
    
        rows.push(`
          <div class="twoNotes">
            <div class="field">
              <label>Notas Adri</label>
              <textarea readonly>${escapeHtml(item.notesAdri ?? "")}</textarea>
            </div>
            <div class="field">
              <label>Notas Laura</label>
              <textarea readonly>${escapeHtml(item.notesLaura ?? "")}</textarea>
            </div>
          </div>
        `);
      }
  
      // --- RESTO CAMPOS ---
      rows.push(field("Plataforma", item.platform || ""));
      rows.push(field("Género", item.genre || ""));
  
      if (isSeries) {
        rows.push(field("Temporadas", item.seasons || ""));
        rows.push(field("Capítulos", item.episodes || ""));
        rows.push(field("Duración Cap.", item.duration || ""));
      } else {
        rows.push(field("Duración", item.duration || ""));
      }
  
      return `
        <div class="formCard" style="box-shadow:none; padding:14px;">
          <div class="formGrid">
            ${rows.join("")}
          </div>
        </div>
      `;
    }
    
    
    function openDetailModal({ kind, id, status = "pendientes" }) {
      const isSeries = kind === "series";
      const isVistas = status === "vistas";
  
      const key = isSeries ?
        (isVistas ? KEY.seriesVistas : KEY.seriesPendientes) :
        (isVistas ? KEY.peliculasVistas : KEY.peliculasPendientes);
  
      const items = loadArray(key);
      let item = items.find(x => x.id === id);
      if (!item) return;
  
      // ✅ asegurar estructura watchLog
      item = ensureWatchLog(item);
  
      // ✅ si es vistas, reflejar último visionado en UI
      if (isVistas) item = applyLastWatchToView(item);
  
      // Guardar contexto para acciones
      currentDetail.kind = kind;
      currentDetail.id = id;
      currentDetail.status = status;
      currentDetail.listKey = key;
      currentDetail.returnScreen = isSeries ?
        (isVistas ? "series-vistas" : "series-pendientes") :
        (isVistas ? "peliculas-vistas" : "peliculas-pendientes");
  
      detailTitle.textContent = item.title || "Detalle";
  
      // Render estilo formulario
      detailBody.innerHTML = renderDetailAsForm(item, { isSeries, isVistas });
  
      // Acciones visibles
      const actions = detailOverlay.querySelector(".modalActions");
      if (actions) actions.style.display = "flex";
  
      // Botón central cambia según estado
      if (detailSeenBtn) detailSeenBtn.textContent = isVistas ? "Volver a ver" : "Visto";
  
      // ✅ Mostrar/ocultar botón Historial según watchLog
      if (typeof detailHistoryBtn !== "undefined" && detailHistoryBtn) {
        const base = ensureWatchLog(item);
        const hasLog = Array.isArray(base.watchLog) && base.watchLog.length > 0;
        detailHistoryBtn.style.display = hasLog ? "inline-flex" : "none";
      }
  
      detailOverlay.classList.add("open");
      detailOverlay.setAttribute("aria-hidden", "false");
      syncBodyModalOpen();
    }
    
    

    function closeDetailModal() {
      detailOverlay.classList.remove("open");
      detailOverlay.setAttribute("aria-hidden", "true");
      syncBodyModalOpen();
    }

    // Cerrar modal: botones / click fuera / ESC
    detailClose.addEventListener("click", closeDetailModal);
    

    detailOverlay.addEventListener("click", (e) => {
      if (e.target === detailOverlay) closeDetailModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && detailOverlay.classList.contains("open")) closeDetailModal();
    });

    // Click en cards de pendientes (delegación)
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".itemCard.clickable");
      if (!card) return;
      openDetailModal({
        kind: card.dataset.kind,
        id: card.dataset.id,
        status: card.dataset.status || "pendientes"
      });
    });

    // Teclado: Enter / Space abre el modal si el foco está en una card
    document.addEventListener ("keydown", (e) => {
      const card = document.activeElement?.closest?.(".itemCard.clickable");
      if (!card) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetailModal({
          kind: card.dataset.kind,
          id: card.dataset.id,
          status: card.dataset.status || "pendientes"
        });
      }
    });
    
    
    // ---------- Confirmación eliminar + Toast ----------
    const detailDeleteBtn = document.getElementById("detailDelete");
    
    const detailEditBtn = document.getElementById("detailEdit");
    if (detailEditBtn) detailEditBtn.addEventListener("click", startEditFromDetail);
    
    // ---------- Modal Historial (watchLog) ----------
    const detailHistoryBtn = document.getElementById("detailHistory");

    const historyOverlay = document.getElementById("historyOverlay");
    const historyClose = document.getElementById("historyClose");
    const historyOk = document.getElementById("historyOk");
    const historyBody = document.getElementById("historyBody");

    function fmtDate(ts) {
      try {
        const d = new Date(ts);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${dd}/${mm}/${yy} ${hh}:${mi}`;
      } catch {
        return "";
      }
    }

    function openHistoryModal() {
      const { kind, id, status, listKey } = currentDetail;
      if (!kind || !id) return;
  
      const isSeries = kind === "series";
      const isVistas = status === "vistas";
  
      const key = listKey || (
        isSeries ?
        (isVistas ? KEY.seriesVistas : KEY.seriesPendientes) :
        (isVistas ? KEY.peliculasVistas : KEY.peliculasPendientes)
      );
  
      const items = loadArray(key);
      const raw = items.find(x => x.id === id);
      if (!raw) return;
  
      const base = ensureWatchLog(raw);
      const log = Array.isArray(base.watchLog) ? base.watchLog : [];
  
      if (log.length === 0) {
        historyBody.innerHTML = `<div class="empty" style="margin-top:0;">No hay visionados guardados todavía.</div>`;
      } else {
        // Más nuevo primero
        const ordered = [...log].sort((a, b) => (b.at || 0) - (a.at || 0));
    
        historyBody.innerHTML = `
          <div class="historyList">
            ${ordered.map((w) => {
              const ra = Number(w.ratingAdri);
              const rl = Number(w.ratingLaura);
              const hasAvg = Number.isFinite(ra) && Number.isFinite(rl);
              const avg = hasAvg ? formatAvg((ra + rl) / 2) : "";

              const na = (w.notesAdri || "").trim();
              const nl = (w.notesLaura || "").trim();

              const hasNotes = !!(na || nl);

              return `
                <div class="historyItem">
                  <div class="historyTop">
                    <div class="historyDate">${escapeHtml(fmtDate(w.at || Date.now()))}</div>
                  </div>

                  <div class="historyMeta">
                    ${hasAvg ? `<span class="metaAvg">⭐ NOTA: ${escapeHtml(avg)}</span>` : ``}
                    <span>Adri: ${escapeHtml(w.ratingAdri ?? "")}</span>
                    <span>Laura: ${escapeHtml(w.ratingLaura ?? "")}</span>
                  </div>

                  ${hasNotes ? `
                    <div class="historyNotes">
                      <div class="field" style="grid-column:1/-1;">
                        <label>Notas Adri</label>
                        <textarea readonly>${escapeHtml(na)}</textarea>
                      </div>
                      <div class="field" style="grid-column:1/-1;">
                        <label>Notas Laura</label>
                        <textarea readonly>${escapeHtml(nl)}</textarea>
                      </div>
                    </div>
                    <div style="margin-top:10px; color: rgba(233,237,255,.72); font-size:12.5px;">
                  Toca esta tarjeta para ver/ocultar notas
                    </div>
                  ` : `
                    <div style="margin-top:10px; color: rgba(233,237,255,.72); font-size:12.5px;">
                  Sin notas en este visionado
                    </div>
                  `}
                </div>
              `;
            }).join("")}
          </div>
        `;
      }
  
      historyOverlay.classList.add("open");
      historyOverlay.setAttribute("aria-hidden", "false");
      syncBodyModalOpen();
    }

    function closeHistoryModal() {
      historyOverlay.classList.remove("open");
      historyOverlay.setAttribute("aria-hidden", "true");
      syncBodyModalOpen();
    }

    // Toggle notas tocando una tarjeta
    historyBody.addEventListener("click", (e) => {
      const it = e.target.closest(".historyItem");
      if (!it) return;
      it.classList.toggle("open");
    });

    if (detailHistoryBtn) {
      detailHistoryBtn.addEventListener("click", openHistoryModal);
    }

    historyClose.addEventListener("click", closeHistoryModal);
    historyOk.addEventListener("click", closeHistoryModal);

    historyOverlay.addEventListener("click", (e) => {
      if (e.target === historyOverlay) closeHistoryModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && historyOverlay.classList.contains("open")) closeHistoryModal();
    });
    
    // --- VISTO: mini modal ---
    const detailSeenBtn = document.getElementById("detailSeen");

    const seenOverlay = document.getElementById("seenOverlay");
    const seenClose = document.getElementById("seenClose");
    const seenSave = document.getElementById("seenSave");

    const seenRatingAdri = document.getElementById("seen-rating-adri");
    const seenRatingLaura = document.getElementById("seen-rating-laura");
    const seenNotesAdri = document.getElementById("seen-notes-adri");
    const seenNotesLaura = document.getElementById("seen-notes-laura");
    const msgSeen = document.getElementById("msg-seen");

    function openSeenModal() {
      // Limpia campos
      setMsg(msgSeen, "", "");
      if (seenNotesAdri) seenNotesAdri.value = "";
      if (seenNotesLaura) seenNotesLaura.value = "";
  
      // Resetea estrellas (usa tu helper ya existente)
      const f = document.getElementById("seenForm");
      if (f) resetRatingsInside(f);
  
      seenOverlay.classList.add("open");
      seenOverlay.setAttribute("aria-hidden", "false");
      syncBodyModalOpen();
    }

    function closeSeenModal() {
      seenOverlay.classList.remove("open");
      seenOverlay.setAttribute("aria-hidden", "true");
      syncBodyModalOpen();
    }

    
    function saveSeenFromDetail() {
      const { kind, id } = currentDetail;
      if (!kind || !id) return;
  
      // Ratings (obligatorias)
      const ra = (seenRatingAdri?.value || "").toString().trim();
      const rl = (seenRatingLaura?.value || "").toString().trim();
  
      if (!ra || !rl) {
        setMsg(msgSeen, "Faltan valoraciones obligatorias.", "error");
        return;
      }
  
      const ratingAdri = Number(ra);
      const ratingLaura = Number(rl);
  
      if (!Number.isFinite(ratingAdri) || !Number.isFinite(ratingLaura)) {
        setMsg(msgSeen, "Las valoraciones no son válidas.", "error");
        return;
      }
  
      // Origen: pendientes
      const fromKey = (kind === "series") ? KEY.seriesPendientes : KEY.peliculasPendientes;
      const fromArr = loadArray(fromKey);
      const item = fromArr.find(x => x.id === id);
      if (!item) return;
  
      // Quitar de pendientes
      const nextFrom = fromArr.filter(x => x.id !== id);
      saveArray(fromKey, nextFrom);
  
      // Entrada historial
      const entry = makeWatchEntry({
        ratingAdri,
        ratingLaura,
        notesAdri: (seenNotesAdri?.value || "").trim(),
        notesLaura: (seenNotesLaura?.value || "").trim(),
        at: Date.now()
      });
  
      // Asegurar watchLog en el item base
      const base = ensureWatchLog(item);
  
      // Item destino (vistas)
      const moved = {
        ...base,
        ratingAdri: entry.ratingAdri,
        ratingLaura: entry.ratingLaura,
        notesAdri: entry.notesAdri,
        notesLaura: entry.notesLaura,
        watchedAt: entry.at,
        watchLog: [...(base.watchLog || []), entry],
        createdAt: Date.now()
      };
  
      // Destino: vistas
      const toKey = (kind === "series") ? KEY.seriesVistas : KEY.peliculasVistas;
      const toArr = loadArray(toKey);
      toArr.unshift(moved);
      saveArray(toKey, toArr);
  
      // Cerrar modales + feedback
      closeSeenModal();
      closeDetailModal();
  
      showToast("Marcado como visto ✓");
      setTimeout(() => {
        showScreen(kind === "series" ? "series-vistas" : "peliculas-vistas");
      }, 1000);
    }
    

    // Listeners
    if (detailSeenBtn) detailSeenBtn.addEventListener("click", () => {
      if (currentDetail.status === "vistas") {
        openConfirmRewatch(); // ✅ Volver a ver
      } else {
        openSeenModal(); // ✅ Marcar como visto (pendientes)
      }
    });

    seenClose.addEventListener("click", closeSeenModal);

    // Click fuera
    seenOverlay.addEventListener("click", (e) => {
      if (e.target === seenOverlay) closeSeenModal();
    });

    // Guardar
    seenSave.addEventListener("click", saveSeenFromDetail);

    // ESC (solo cierra el mini modal si está abierto)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && seenOverlay.classList.contains("open")) closeSeenModal();
    });

    const confirmOverlay = document.getElementById("confirmOverlay");
    const confirmClose = document.getElementById("confirmClose");
    const confirmCancel = document.getElementById("confirmCancel");
    const confirmDelete = document.getElementById("confirmDelete");
    
    let confirmMode = "delete"; // "delete" | "rewatch"

    function openConfirmDelete() {
      confirmMode = "delete";
      const confirmTitle = document.getElementById("confirmTitle");
      const confirmBody = document.getElementById("confirmBody");
  
      if (confirmTitle) confirmTitle.textContent = "Confirmar eliminación";
      if (confirmBody) confirmBody.innerHTML = `
        <div style="font-weight:800; margin-bottom:8px;">¿Seguro que quieres eliminarlo?</div>
        <div style="color: rgba(233,237,255,.78); line-height:1.4;">
          Esta acción eliminará la película o serie <b>permanentemente</b>.
        </div>
      `;
  
      if (confirmDelete) confirmDelete.textContent = "Eliminar";
      openConfirm();
    }

    function openConfirmRewatch() {
      confirmMode = "rewatch";
      const confirmTitle = document.getElementById("confirmTitle");
      const confirmBody = document.getElementById("confirmBody");
  
      if (confirmTitle) confirmTitle.textContent = "Volver a ver";
      if (confirmBody) confirmBody.innerHTML = `
        <div style="font-weight:800; margin-bottom:8px;">¿Quieres pasar este registro a “Pendientes”?</div>
        <div style="color: rgba(233,237,255,.78); line-height:1.4;">
          Volverá a aparecer en pendientes. No perderás la información guardada (notas/valoraciones).
        </div>
      `;
  
      if (confirmDelete) confirmDelete.textContent = "Pasar a pendientes";
      openConfirm();
    }

    const toast = document.getElementById("toast");
    
    function syncBodyModalOpen() {
      const anyOpen = document.querySelector(".modalOverlay.open") !== null;
      document.body.classList.toggle("modalOpen", anyOpen);
    }

    function openConfirm() {
      confirmOverlay.classList.add("open");
      confirmOverlay.setAttribute("aria-hidden", "false");
      syncBodyModalOpen();
    }

    function closeConfirm() {
      confirmOverlay.classList.remove("open");
      confirmOverlay.setAttribute("aria-hidden", "true");
      syncBodyModalOpen();
    }
    
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1000);
    }

    
    function deleteCurrentItem() {
      const { kind, id, returnScreen, status, listKey } = currentDetail;
      if (!kind || !id) return;
  
      const isSeries = kind === "series";
      const isVistas = status === "vistas";
  
      // ✅ Key robusta: si no hay listKey, deducimos por kind+status
      const key =
        listKey ||
        (isSeries ?
          (isVistas ? KEY.seriesVistas : KEY.seriesPendientes) :
          (isVistas ? KEY.peliculasVistas : KEY.peliculasPendientes));
  
      const items = loadArray(key);
      const next = items.filter(x => x.id !== id);
      saveArray(key, next);
  
      closeConfirm();
      closeDetailModal();
  
      showToast("Eliminado ✓");
      setTimeout(() => {
        showScreen(returnScreen || (isSeries ? (isVistas ? "series-vistas" : "series-pendientes") :
          (isVistas ? "peliculas-vistas" : "peliculas-pendientes")));
      }, 1000);
    }
    
    
    function moveBackToPendientes() {
      const { kind, id, listKey } = currentDetail;
      if (!kind || !id) return;
  
      // Origen: VISTAS (por seguridad, usa listKey si viene)
      const fromKey = listKey || (kind === "series" ? KEY.seriesVistas : KEY.peliculasVistas);
      const fromArr = loadArray(fromKey);
      const item = fromArr.find(x => x.id === id);
      if (!item) return;
  
      // Quitar de vistas
      const nextFrom = fromArr.filter(x => x.id !== id);
      saveArray(fromKey, nextFrom);
  
      // Destino: PENDIENTES
      const toKey = (kind === "series") ? KEY.seriesPendientes : KEY.peliculasPendientes;
      const toArr = loadArray(toKey);
  
      // ✅ Mantener createdAt original; usamos movedBackAt para ordenar "reciente"
      const moved = {
        ...item,
        movedBackAt: Date.now()
      };
  
      // Lo añadimos arriba para que se vea el primero (y además renderPendientes ordenará bien)
      toArr.unshift(moved);
      saveArray(toKey, toArr);
  
      closeConfirm();
      closeDetailModal();
  
      showToast("Pasado a pendientes ✓");
      setTimeout(() => {
        showScreen(kind === "series" ? "series-pendientes" : "peliculas-pendientes");
      }, 1000);
    }
    
    
    // Abrir confirmación desde el botón Eliminar del detalle
    if (detailDeleteBtn) detailDeleteBtn.addEventListener("click", openConfirmDelete);

    // Cerrar confirm modal
    confirmClose.addEventListener("click", closeConfirm);
    confirmCancel.addEventListener("click", closeConfirm);

    // Click fuera para cerrar confirm
    confirmOverlay.addEventListener("click", (e) => {
      if (e.target === confirmOverlay) closeConfirm();
    });

    // Confirmar eliminación
    confirmDelete.addEventListener("click", () => {
      if (confirmMode === "delete") deleteCurrentItem();
      if (confirmMode === "rewatch") moveBackToPendientes();
});

    // ESC: si está abierto confirm, cierra confirm (sin cerrar el detalle)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && confirmOverlay.classList.contains("open")) closeConfirm();
    });

    // ---------- Rating widget (10 estrellas, medias con click) ----------
    const STAR_PATH = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

    function createStarSVG({fillClass, clip} = {}){
      const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
      svg.setAttribute("viewBox","0 0 24 24");
      svg.classList.add("starSvg");

      const outline = document.createElementNS("http://www.w3.org/2000/svg","path");
      outline.setAttribute("d", STAR_PATH);
      outline.classList.add("starOutline");
      svg.appendChild(outline);

      if(fillClass){
        const fill = document.createElementNS("http://www.w3.org/2000/svg","path");
        fill.setAttribute("d", STAR_PATH);
        fill.classList.add(fillClass);

        if(clip){
          const defs = document.createElementNS("http://www.w3.org/2000/svg","defs");
          const clipPath = document.createElementNS("http://www.w3.org/2000/svg","clipPath");
          clipPath.setAttribute("id", clip.id);
          const rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
          rect.setAttribute("x","0");
          rect.setAttribute("y","0");
          rect.setAttribute("width", clip.width);
          rect.setAttribute("height","24");
          clipPath.appendChild(rect);
          defs.appendChild(clipPath);
          svg.appendChild(defs);

          fill.setAttribute("clip-path", `url(#${clip.id})`);
        }

        svg.appendChild(fill);
      }

      return svg;
    }

    function initRatingWidget(container){
      const targetId = container.dataset.target;
      const outId = container.dataset.out;

      const hidden = document.getElementById(targetId);
      const out = document.getElementById(outId);

      let value = 0; // 0 means none selected

      function render(){
        container.innerHTML = "";
        for(let i=1;i<=10;i++){
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "starBtn";
          btn.setAttribute("aria-label", `Estrella ${i}`);

          // Determine fill for this star: full, half, empty
          const starVal = i;         // full threshold
          const halfVal = i - 0.5;   // half threshold

          if(value >= starVal){
            btn.appendChild(createStarSVG({fillClass:"starFillFull"}));
          }else if(value >= halfVal){
            // half fill: clip to 12px (half of 24)
            const clipId = `${targetId}_clip_${i}_${Math.random().toString(36).slice(2,7)}`;
            btn.appendChild(createStarSVG({fillClass:"starFillHalf", clip:{id:clipId, width:"12"}}));
          }else{
            btn.appendChild(createStarSVG());
          }

          // click: left half => i-0.5, right half => i
          btn.addEventListener("click", (e)=>{
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const half = x < rect.width/2 ? 0.5 : 1.0;
            value = (i - 1) + half; // because i is 1..10
            value = Math.round(value * 2) / 2;

            hidden.value = String(value);
            out.textContent = `${value}`;
            render();
          });

          container.appendChild(btn);
        }

        if (!hidden.value) {
          out.textContent = "—";
        } else {
          out.textContent = `${hidden.value}`;
        }
      }

      function reset(){
        value = 0;
        hidden.value = "";
        out.textContent = "—";
        render();
      }
      
      function set(val) {
        const n = Number(val);
        if (!Number.isFinite(n) || n <= 0) {
          value = 0;
          hidden.value = "";
          out.textContent = "—";
          render();
          return;
        }
        value = Math.round(n * 2) / 2;
        hidden.value = String(value);
        out.textContent = `${value}`;
        render();
      }

      container._setRating = set;

      // first render
      render();
      container._resetRating = reset;
    }

    // Crear widgets para todos los ratings
    document.querySelectorAll('[data-widget="rating"]').forEach(initRatingWidget);

    function resetRatingsInside(form){
      form.querySelectorAll('[data-widget="rating"]').forEach(w => {
        if(typeof w._resetRating === "function") w._resetRating();
      });
    }

    // ---------- Guardado ----------
    function savePendiente({ form, key, msgEl }) {
      setMsg(msgEl, "", "");
      const data = new FormData(form);
  
      const title = (data.get("title") || "").toString().trim();
      const platform = (data.get("platform") || "").toString().trim();
      const genre = (data.get("genre") || "").toString().trim();
      const duration = (data.get("duration") || "").toString().trim();
      const synopsis = (data.get("synopsis") || data.get("notes") || "").toString().trim();
  
      // ✅ nuevos campos (solo existen en series)
      const seasons = (data.get("seasons") || "").toString().trim();
      const episodes = (data.get("episodes") || "").toString().trim();
  
      if (!title) {
        setMsg(msgEl, "El título es obligatorio.", "error");
        const inputTitle = form.querySelector('input[name="title"]');
        if (inputTitle) inputTitle.focus();
        return;
      }
  
      const arr = loadArray(key);
  
      // ✅ MODO EDICIÓN: actualiza
      const editId = form.dataset.editId;
      if (editId) {
        const updated = arr.map((x) => {
          if (x.id !== editId) return x;
      
          // Guardar seasons/episodes solo si ese form los tiene
          const hasSE = !!form.querySelector('input[name="seasons"]');
      
          return {
            ...x,
            title,
            platform,
            genre,
            duration,
            synopsis,
            ...(hasSE ? { seasons, episodes } : {}),
            updatedAt: Date.now(),
          };
        });
    
        saveArray(key, updated);
    
        form.reset();
        setMsg(msgEl, "Actualizado ✓", "ok");
    
        const returnScreen =
          form.dataset.returnScreen ||
          (form.dataset.editKind === "series" ? "series-pendientes" : "peliculas-pendientes");
    
        clearEditModeIfAny();
        showToast("Actualizado ✓");
        setTimeout(() => showScreen(returnScreen), 900);
        return;
      }
  
      // ✅ ALTA NUEVA: aquí es donde te faltaba el 2.A
      const hasSE = !!form.querySelector('input[name="seasons"]');
  
      const item = {
        id: newId(),
        title,
        platform,
        genre,
        duration,
        synopsis,
        ...(hasSE ? { seasons, episodes } : {}),
        createdAt: Date.now(),
      };
  
      arr.push(item);
      saveArray(key, arr);
  
      form.reset();
      setMsg(msgEl, "Guardado ✓", "ok");
    }
    
    
    function saveVista({ form, key, msgEl }) {
      setMsg(msgEl, "", "");
      const data = new FormData(form);
  
      const title = (data.get("title") || "").toString().trim();
      const platform = (data.get("platform") || "").toString().trim();
      const genre = (data.get("genre") || "").toString().trim();
      const duration = (data.get("duration") || "").toString().trim();
  
      const seasons = (data.get("seasons") || "").toString().trim();
      const episodes = (data.get("episodes") || "").toString().trim();
  
      const ratingAdriRaw = (data.get("ratingAdri") || "").toString().trim();
      const ratingLauraRaw = (data.get("ratingLaura") || "").toString().trim();
  
      const notesAdri = (data.get("notesAdri") || "").toString().trim();
      const notesLaura = (data.get("notesLaura") || "").toString().trim();
  
      if (!title) {
        setMsg(msgEl, "El título es obligatorio.", "error");
        const inputTitle = form.querySelector('input[name="title"]');
        if (inputTitle) inputTitle.focus();
        return;
      }
      if (!ratingAdriRaw) {
        setMsg(msgEl, "La valoración de Adri es obligatoria.", "error");
        return;
      }
      if (!ratingLauraRaw) {
        setMsg(msgEl, "La valoración de Laura es obligatoria.", "error");
        return;
      }
  
      const ratingAdri = Number(ratingAdriRaw);
      const ratingLaura = Number(ratingLauraRaw);
  
      if (!Number.isFinite(ratingAdri) || !Number.isFinite(ratingLaura)) {
        setMsg(msgEl, "Las valoraciones no son válidas.", "error");
        return;
      }
  
      const hasSE = !!form.querySelector('input[name="seasons"]');
      const arr = loadArray(key);
  
      // ✅ MODO EDICIÓN (Editar = corregir el ÚLTIMO visionado)
      const editId = form.dataset.editId;
      if (editId) {
        const updated = arr.map(x => {
          if (x.id !== editId) return x;
      
          const base = ensureWatchLog(x);
      
          let nextLog = Array.isArray(base.watchLog) ? [...base.watchLog] : [];
          if (nextLog.length === 0) {
            nextLog = [makeWatchEntry({ ratingAdri, ratingLaura, notesAdri, notesLaura, at: base.watchedAt || Date.now() })];
          } else {
            nextLog[nextLog.length - 1] = {
              ...nextLog[nextLog.length - 1],
              ratingAdri,
              ratingLaura,
              notesAdri,
              notesLaura
            };
          }
      
          return {
            ...base,
            title,
            platform,
            genre,
            duration,
            ...(hasSE ? { seasons, episodes } : {}),
            ratingAdri,
            ratingLaura,
            notesAdri,
            notesLaura,
            watchLog: nextLog,
            updatedAt: Date.now(),
          };
        });
    
        saveArray(key, updated);
    
        form.reset();
        resetRatingsInside(form);
        setMsg(msgEl, "Actualizado ✓", "ok");
    
        const returnScreen =
          form.dataset.returnScreen ||
          (form.dataset.editKind === "series" ? "series-vistas" : "peliculas-vistas");
    
        clearEditModeIfAny();
        showToast("Actualizado ✓");
        setTimeout(() => showScreen(returnScreen), 900);
        return;
      }
  
      // ✅ ALTA NUEVA (crear primera entrada de historial)
      const entry = makeWatchEntry({ ratingAdri, ratingLaura, notesAdri, notesLaura, at: Date.now() });
  
      const item = {
        id: newId(),
        title,
        platform,
        genre,
        duration,
        ...(hasSE ? { seasons, episodes } : {}),
        ratingAdri: entry.ratingAdri,
        ratingLaura: entry.ratingLaura,
        notesAdri: entry.notesAdri,
        notesLaura: entry.notesLaura,
        watchedAt: entry.at,
        watchLog: [entry],
        createdAt: Date.now(),
      };
  
      arr.push(item);
      saveArray(key, arr);
  
      form.reset();
      resetRatingsInside(form);
      setMsg(msgEl, "Guardado ✓", "ok");
    }
    
    
    
    // ---------- Wire forms ----------
    const formSP = document.getElementById("form-series-pendientes");
    const formPP = document.getElementById("form-peliculas-pendientes");
    const formSV = document.getElementById("form-series-vistas");
    const formPV = document.getElementById("form-peliculas-vistas");

    formSP.addEventListener("submit", (e)=>{ e.preventDefault(); savePendiente({form:formSP, key:KEY.seriesPendientes, msgEl:document.getElementById("msg-sp")}); });
    formPP.addEventListener("submit", (e)=>{ e.preventDefault(); savePendiente({form:formPP, key:KEY.peliculasPendientes, msgEl:document.getElementById("msg-pp")}); });

    formSV.addEventListener("submit", (e)=>{ e.preventDefault(); saveVista({form:formSV, key:KEY.seriesVistas, msgEl:document.getElementById("msg-sv")}); });
    formPV.addEventListener("submit", (e)=>{ e.preventDefault(); saveVista({form:formPV, key:KEY.peliculasVistas, msgEl:document.getElementById("msg-pv")}); });

    migrateWatchLog();

    // Render inicial de contadores/listas (por si hay datos previos)
    renderPendientes("series");
    renderPendientes("peliculas");
    renderVistas("series");
    renderVistas("peliculas");
    
    
    // Si sales de la pantalla de edición con "Volver", limpiamos modo edición
const backSP = document.querySelector('.screen[data-screen="anadir-series-pendientes"] #form-series-pendientes .backBtn');
if (backSP) backSP.addEventListener("click", () => clearEditModeIfAny());

const backPP = document.querySelector('.screen[data-screen="anadir-peliculas-pendientes"] #form-peliculas-pendientes .backBtn');
if (backPP) backPP.addEventListener("click", () => clearEditModeIfAny());

const backSV = document.querySelector('.screen[data-screen="anadir-series-vistas"] #form-series-vistas .backBtn');
if (backSV) backSV.addEventListener("click", () => clearEditModeIfAny());

const backPV = document.querySelector('.screen[data-screen="anadir-peliculas-vistas"] #form-peliculas-vistas .backBtn');
if (backPV) backPV.addEventListener("click", () => clearEditModeIfAny());
  
  
tabs.forEach(t => t.addEventListener("click", () => setMainTab(t.dataset.main)));



// SOLO botones (evita el bug de burbujeo)
document.querySelectorAll("button[data-screen]").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    showScreen(btn.dataset.screen);
  });
});


// ===== Botones Exportar / Importar =====
const btnExport = document.getElementById("btnExport");
const importFileReplace = document.getElementById("importFileReplace");
const importFileMerge = document.getElementById("importFileMerge");

if (btnExport) {
  btnExport.addEventListener("click", () => exportAllData());
}

async function readImportFile(file) {
  return await (typeof file.text === "function" ?
    file.text() :
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(r.error || new Error("No se pudo leer el archivo."));
      r.readAsText(file);
    })
  );
}

// ===== IMPORTAR REEMPLAZAR =====
if (importFileReplace) {
  importFileReplace.addEventListener("click", () => {
    importFileReplace.value = "";
  });
  
  importFileReplace.addEventListener("change", async () => {
    const file = importFileReplace.files && importFileReplace.files[0];
    if (!file) {
      alert("No se detectó archivo (REEMPLAZAR).");
      return;
    }
    
    
    
    try {
      const text = await readImportFile(file);
      const parsed = parseImportJson(text);
      
      importReplaceAll(parsed);

      importFileReplace.value = "";
    } catch (err) {
      console.error(err);
      importFileReplace.value = "";
      alert("No se pudo importar.\n\nDetalle: " + (err?.message || err));
    }
  });
}

// ===== IMPORTAR MEZCLAR =====
if (importFileMerge) {
  importFileMerge.addEventListener("click", () => {
    importFileMerge.value = "";
  });
  
  importFileMerge.addEventListener("change", async () => {
    const file = importFileMerge.files && importFileMerge.files[0];
    if (!file) {
      alert("No se detectó archivo (MEZCLAR).");
      return;
    }
    
    
    
    try {
      const text = await readImportFile(file);
      const parsed = parseImportJson(text);
      
      importMergeAll(parsed);

      importFileMerge.value = "";
    } catch (err) {
      console.error(err);
      importFileMerge.value = "";
      alert("No se pudo importar.\n\nDetalle: " + (err?.message || err));
    }
  });
}


// Toolbar (Filtrar / Ordenar)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action][data-scope]");
  if (!btn) return;

  const action = btn.dataset.action; // "filter" | "sort"
  const scope  = btn.dataset.scope;  // pantalla

  if (action === "filter") openFilterModal(scope);
  if (action === "sort") openSortModal(scope);
});


// ===== Toggle buscador (🔎 abre/cierra en fila inferior) =====
document.addEventListener("click", (e) => {
  const toggle = e.target.closest("button[data-search-toggle]");
  if (!toggle) return;
  
  const scope = toggle.dataset.searchToggle;
  const box = document.querySelector(`.searchBox[data-search-box="${scope}"]`);
  const screen = document.querySelector(`.screen[data-screen="${scope}"]`);
  if (!box || !screen) return;
  
  const willOpen = !box.classList.contains("open");
  
  // Cerrar todos los buscadores abiertos (opcional pero recomendado)
  document.querySelectorAll(".searchBox.open").forEach(b => b.classList.remove("open"));
  document.querySelectorAll(".screen.searchOpen").forEach(s => s.classList.remove("searchOpen"));
  
  if (willOpen) {
    box.classList.add("open");
    screen.classList.add("searchOpen");
    const input = box.querySelector("input.searchInput");
    if (input) input.focus();
  } else {
    box.classList.remove("open");
    screen.classList.remove("searchOpen");
  }
});



function initFromHash() {
  const h = (location.hash || "").replace("#", "").trim().toLowerCase();
  if (h === "peliculas" || h === "anadir" || h === "series") setMainTab(h);
  else setMainTab("series");
}
window.addEventListener("hashchange", initFromHash);
updateAllFilterBadges();
syncAllSearchInputs();
initFromHash();
    
 
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js")
        .then(reg => console.log("Service Worker registrado"))
        .catch(err => console.log("Error Service Worker", err));
    });
  }
