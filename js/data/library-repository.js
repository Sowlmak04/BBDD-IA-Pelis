// ---------- Repositorio de biblioteca ----------
const LibraryRepository = (() => {
  function parseArray(raw) {
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function read(key) {
    const items = parseArray(localStorage.getItem(key));
    AppState.setCollection(key, items);
    return AppState.getCollection(key);
  }

  function write(key, items) {
    const safeItems = Array.isArray(items) ? items : [];
    localStorage.setItem(key, JSON.stringify(safeItems));
    AppState.setCollection(key, safeItems);
    return AppState.getCollection(key);
  }

  function loadAll() {
    const data = {
      [KEY.seriesPendientes]: read(KEY.seriesPendientes),
      [KEY.peliculasPendientes]: read(KEY.peliculasPendientes),
      [KEY.seriesVistas]: read(KEY.seriesVistas),
      [KEY.peliculasVistas]: read(KEY.peliculasVistas)
    };

    AppState.replaceAll(data);
    return data;
  }

  function getAll(key) {
    // Durante este sprint se relee localStorage para conservar
    // exactamente el comportamiento de la versión anterior.
    return read(key);
  }

  function replaceAll(key, items) {
    return write(key, items);
  }

  function findById(key, id) {
    return getAll(key).find(item => item.id === id) || null;
  }

  return Object.freeze({
    loadAll,
    getAll,
    replaceAll,
    findById
  });
})();
