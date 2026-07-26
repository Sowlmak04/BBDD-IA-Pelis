// ---------- Storage ----------
    const KEY = {
      seriesPendientes: "inv_series_pendientes",
      peliculasPendientes: "inv_peliculas_pendientes",
      seriesVistas: "inv_series_vistas",
      peliculasVistas: "inv_peliculas_vistas",
    };

// ---------- Esquema y migración de almacenamiento ----------
const STORAGE_SCHEMA_KEY = "inv_storage_schema_version";
const STORAGE_SCHEMA_VERSION = 2;

const LEGACY_STORAGE_KEYS = {
  seriesPendientes: [
    "seriesPendientes", "series_pendientes", "sp",
    "pendingSeries", "series_pending"
  ],
  peliculasPendientes: [
    "peliculasPendientes", "peliculas_pendientes", "pp",
    "moviesPendientes", "pendingMovies", "movies_pending"
  ],
  seriesVistas: [
    "seriesVistas", "series_vistas", "sv",
    "watchedSeries", "series_watched"
  ],
  peliculasVistas: [
    "peliculasVistas", "peliculas_vistas", "pv",
    "moviesVistas", "watchedMovies", "movies_watched"
  ]
};

function safeParseArray(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function migrateLegacyArray(targetKey, aliases) {
  const current = safeParseArray(localStorage.getItem(targetKey));

  // Nunca sobrescribimos datos válidos que ya existan en la clave actual.
  if (current && current.length > 0) {
    return { migrated: false, source: null, count: current.length };
  }

  for (const alias of aliases) {
    if (alias === targetKey) continue;
    const legacy = safeParseArray(localStorage.getItem(alias));
    if (legacy && legacy.length > 0) {
      localStorage.setItem(targetKey, JSON.stringify(legacy));
      return { migrated: true, source: alias, count: legacy.length };
    }
  }

  // Si la clave actual todavía no existe, la inicializamos sin borrar nada.
  if (localStorage.getItem(targetKey) === null) {
    localStorage.setItem(targetKey, "[]");
  }

  return { migrated: false, source: null, count: current?.length || 0 };
}

function initStorageSchema() {
  const report = {
    origin: location.origin,
    pathname: location.pathname,
    previousVersion: Number(localStorage.getItem(STORAGE_SCHEMA_KEY) || 0),
    currentVersion: STORAGE_SCHEMA_VERSION,
    migrations: []
  };

  report.migrations.push({
    target: KEY.seriesPendientes,
    ...migrateLegacyArray(KEY.seriesPendientes, LEGACY_STORAGE_KEYS.seriesPendientes)
  });
  report.migrations.push({
    target: KEY.peliculasPendientes,
    ...migrateLegacyArray(KEY.peliculasPendientes, LEGACY_STORAGE_KEYS.peliculasPendientes)
  });
  report.migrations.push({
    target: KEY.seriesVistas,
    ...migrateLegacyArray(KEY.seriesVistas, LEGACY_STORAGE_KEYS.seriesVistas)
  });
  report.migrations.push({
    target: KEY.peliculasVistas,
    ...migrateLegacyArray(KEY.peliculasVistas, LEGACY_STORAGE_KEYS.peliculasVistas)
  });

  localStorage.setItem(STORAGE_SCHEMA_KEY, String(STORAGE_SCHEMA_VERSION));
  localStorage.setItem("inv_storage_last_check", String(Date.now()));

  console.info("[Storage 2.1]", report);
  return report;
}



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
