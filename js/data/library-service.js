// ---------- Servicio de biblioteca ----------
const LibraryService = (() => {
  function getCollection(key) {
    return LibraryRepository.getAll(key);
  }

  function getById(key, id) {
    return LibraryRepository.findById(key, id);
  }

  function add(key, item, { prepend = false } = {}) {
    const current = LibraryRepository.getAll(key);
    const next = prepend ? [item, ...current] : [...current, item];
    LibraryRepository.replaceAll(key, next);
    return item;
  }

  function update(key, id, updater) {
    let updatedItem = null;

    const next = LibraryRepository.getAll(key).map(item => {
      if (item.id !== id) return item;

      updatedItem =
        typeof updater === "function"
          ? updater(item)
          : { ...item, ...(updater || {}) };

      return updatedItem;
    });

    LibraryRepository.replaceAll(key, next);
    return updatedItem;
  }

  function remove(key, id) {
    const current = LibraryRepository.getAll(key);
    const removed = current.find(item => item.id === id) || null;

    if (!removed) return null;

    LibraryRepository.replaceAll(
      key,
      current.filter(item => item.id !== id)
    );

    return removed;
  }

  function move({
    fromKey,
    toKey,
    id,
    transform = item => item,
    prepend = true
  }) {
    const item = LibraryRepository.findById(fromKey, id);
    if (!item) return null;

    const moved = transform(item);

    remove(fromKey, id);
    add(toKey, moved, { prepend });

    return moved;
  }

  function replaceCollection(key, items) {
    return LibraryRepository.replaceAll(key, items);
  }

  return Object.freeze({
    getCollection,
    getById,
    add,
    update,
    remove,
    move,
    replaceCollection
  });
})();
