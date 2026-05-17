import { BibleSource } from "./source.js";

/**
 * ListenFaithfullySource — streams Bible audio directly from an
 * Audiobookshelf / ListenFaithfully instance.
 *
 * ── SCAN MODES ──────────────────────────────────────────────────────────────
 *
 * "sequential"  (default)
 *   Maps all audio files in the library sequentially to Bible chapters:
 *   file 1 → Genesis 1, file 2 → Genesis 2, etc. No naming convention needed.
 *
 * "pattern"
 *   Matches each filename against a regex with named capture groups
 *   <book> and <chapter>. Default regex matches "01-001.mp3" (Genesis 1).
 *
 * ── MULTI-LIBRARY / M/O SWITCHING ───────────────────────────────────────────
 *
 * When the device's M/O button is pressed, call:
 *   source.nextLibrary()
 *
 * The source cycles through the `libraries` array defined in config.source.
 * Each entry is: { name, libraryName?, libraryId?, scanMode?, filePattern? }
 *
 * ── CONFIG EXAMPLE ───────────────────────────────────────────────────────────
 * {
 *   "source": {
 *     "type": "listenfaithfully",
 *     "baseUrl": "http://...",
 *     "token": "...",
 *     "libraries": [
 *       { "name": "BIBLE",  "libraryName": "bible",  "scanMode": "pattern"     },
 *       { "name": "DEMO",   "libraryName": "demo",   "scanMode": "sequential"  },
 *       { "name": "PRAISE", "libraryName": "praise", "scanMode": "sequential"  }
 *     ]
 *   }
 * }
 *
 * If `libraries` is omitted, falls back to legacy single-library fields:
 * { libraryName, libraryId, scanMode, filePattern }
 */
export class ListenFaithfullySource extends BibleSource {
  /**
   * @param {object}  opts
   * @param {string}  opts.baseUrl      LF origin + router base, no trailing slash.
   * @param {string}  opts.token        API token (JWT).
   * @param {Array}   [opts.libraries]  Array of library slot descriptors (see above).
   * @param {string}  [opts.libraryId]  Legacy: single library UUID.
   * @param {string}  [opts.libraryName] Legacy: find library by name.
   * @param {string}  [opts.scanMode]   Legacy: "sequential" | "pattern".
   * @param {string}  [opts.filePattern] Legacy: regex for pattern mode.
   * @param {Array}   [opts.books]      66-book canon table, injected by factory.
   */
  constructor({
    baseUrl     = "",
    token       = "",
    libraries   = null,
    libraryId   = "",
    libraryName = "",
    scanMode    = "sequential",
    filePattern = "",
    books       = [],
  } = {}) {
    super();
    this._base  = baseUrl.replace(/\/$/, "");
    this._token = token;
    this._books = books;

    // Normalise the libraries list
    if (libraries && libraries.length) {
      this._libraries = libraries.map((l) => ({
        name:        l.name ?? l.libraryName ?? "LIB",
        libraryId:   l.libraryId   ?? "",
        libraryName: l.libraryName ?? "",
        scanMode:    l.scanMode    ?? "sequential",
        filePattern: l.filePattern ?? "",
      }));
    } else {
      // Legacy single-library config
      this._libraries = [{
        name:        libraryName || libraryId || "LIB",
        libraryId,
        libraryName,
        scanMode,
        filePattern,
      }];
    }

    this._libIndex = 0;

    /** Per-library catalog cache: Map<libIndex, Map<number, string>> (url) */
    this._catalogs = new Map();
    /** Per-library name cache: Map<libIndex, Map<number, string>> (track title) */
    this._nameMaps = new Map();
    this._catalogPromises = new Map();
  }

  // ── Identity ──────────────────────────────────────────────────────────────

  get _currentLib() { return this._libraries[this._libIndex]; }

  get name() {
    const lib = this._currentLib;
    return `ListenFaithfully (${this._base}) [${lib.scanMode}:${lib.name}]`;
  }

  /** Displayed on the LCD mode row — upper-left of the screen. */
  get modeName() { return this._currentLib.name.toUpperCase(); }

  /** True when the current library uses filename-pattern (Bible) indexing. */
  get isBibleMode() { return this._currentLib.scanMode === "pattern"; }

  // ── Library switching (called by Device._onMode) ─────────────────────────

  /**
   * Advance to the next library slot. Returns the new slot descriptor so
   * the device can update the LCD mode label immediately.
   * @returns {{ name: string }} the new active library slot
   */
  nextLibrary() {
    this._libIndex = (this._libIndex + 1) % this._libraries.length;
    // Return the slot so the caller can flash the name on the LCD
    return this._currentLib;
  }

  // ── Public BibleSource API ────────────────────────────────────────────────

  async getAudioUrl(bookId, chapter) {
    const catalog = await this._ensureCatalog(this._libIndex);
    return catalog.get(this._key(bookId, chapter)) ?? null;
  }

  async hasAudio(bookId, chapter) {
    const catalog = await this._ensureCatalog(this._libIndex);
    return catalog.has(this._key(bookId, chapter));
  }

  /**
   * Returns the track/item title for the given position, or null in Bible mode
   * (where the book abbreviation + chapter number is shown instead).
   */
  async getTrackName(bookId, chapter) {
    if (this.isBibleMode) return null;
    await this._ensureCatalog(this._libIndex); // guarantees _nameMaps is populated
    const nameMap = this._nameMaps.get(this._libIndex);
    return nameMap?.get(this._key(bookId, chapter)) ?? null;
  }

  // ── Catalog management ────────────────────────────────────────────────────

  _key(bookId, chapter) { return bookId * 1000 + chapter; }

  async _ensureCatalog(idx) {
    if (this._catalogs.has(idx)) return this._catalogs.get(idx);
    if (this._catalogPromises.has(idx)) return this._catalogPromises.get(idx);

    const promise = this._buildCatalog(idx)
      .then((map) => {
        this._catalogs.set(idx, map);
        this._catalogPromises.delete(idx);
        return map;
      })
      .catch((err) => {
        this._catalogPromises.delete(idx);
        console.error(`[ListenFaithfullySource] Failed to build catalog for slot ${idx}:`, err);
        return new Map();
      });

    this._catalogPromises.set(idx, promise);
    return promise;
  }

  async _buildCatalog(idx) {
    const slot      = this._libraries[idx];
    const libraryId = await this._resolveLibraryId(slot);
    const listItems = await this._fetchAllLibraryItems(libraryId);

    // The library list endpoint returns minified items (audio file counts only,
    // no actual audioFiles array). Fetch full details for each item individually.
    const allItems = await Promise.all(
      listItems.map((item) => this._fetchFullItem(item))
    );

    const { urlMap, nameMap } = slot.scanMode === "pattern"
      ? this._indexByPattern(allItems, slot)
      : this._indexSequentially(allItems);

    this._nameMaps.set(idx, nameMap);

    console.info(
      `[ListenFaithfullySource] [${slot.name}] Catalog built (${slot.scanMode}): ` +
      `${urlMap.size} chapters from ${allItems.length} items.`
    );
    return urlMap;
  }

  /**
   * Fetch the full expanded item from /api/items/:id.
   * Falls back to the list-item if the request fails.
   */
  async _fetchFullItem(listItem) {
    try {
      return await this._apiFetch(`/api/items/${listItem.id}?expanded=1`);
    } catch (err) {
      console.warn(`[ListenFaithfullySource] Could not fetch full details for item ${listItem.id}:`, err);
      return listItem;
    }
  }

  // ── Sequential indexing ───────────────────────────────────────────────────

  _indexSequentially(allItems) {
    const flatFiles = [];
    for (const item of allItems) {
      const title      = (item.media?.metadata?.title ?? item.id).toLowerCase();
      const displayTitle = item.media?.metadata?.title ?? item.id;
      const audioFiles = this._extractAudioFiles(item);
      for (const af of audioFiles) {
        flatFiles.push({ itemId: item.id, af, title, displayTitle, trackIndex: af.index ?? 0 });
      }
    }

    flatFiles.sort((a, b) => {
      const t = a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" });
      return t !== 0 ? t : a.trackIndex - b.trackIndex;
    });

    const urlMap  = new Map();
    const nameMap = new Map();
    let pos = 0;
    outer:
    for (const book of this._books) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        if (pos >= flatFiles.length) break outer;
        const { itemId, af, displayTitle } = flatFiles[pos++];
        const key = this._key(book.id, ch);
        urlMap.set(key,  this._buildStreamUrl(itemId, af.ino));
        nameMap.set(key, displayTitle);
      }
    }
    return { urlMap, nameMap };
  }

  // ── Pattern indexing ──────────────────────────────────────────────────────

  _indexByPattern(allItems, slot) {
    const regex = slot.filePattern
      ? new RegExp(slot.filePattern)
      : /(?<book>\d+)-(?<chapter>\d+)/;

    const urlMap  = new Map();
    const nameMap = new Map(); // pattern mode: names not used by the display
    for (const item of allItems) {
      const title = item.media?.metadata?.title ?? "";
      for (const af of this._extractAudioFiles(item)) {
        const filename = af.metadata?.filename
          ?? af.metadata?.path?.split(/[\/\\]/).pop()
          ?? "";
        const match = filename.match(regex);
        if (!match?.groups?.book || !match?.groups?.chapter) continue;
        const bookId  = parseInt(match.groups.book,    10);
        const chapter = parseInt(match.groups.chapter, 10);
        if (!bookId || !chapter) continue;
        const key = this._key(bookId, chapter);
        urlMap.set(key,  this._buildStreamUrl(item.id, af.ino));
        nameMap.set(key, title);
      }
    }
    return { urlMap, nameMap };
  }

  // ── LF API helpers ────────────────────────────────────────────────────────

  async _resolveLibraryId(slot) {
    if (slot.libraryId) return slot.libraryId;

    const libs      = await this._apiFetch("/api/libraries");
    const libraries = libs?.libraries ?? [];
    if (!libraries.length) throw new Error("[ListenFaithfullySource] No libraries found.");

    if (slot.libraryName) {
      const target = slot.libraryName.toLowerCase();
      const found  = libraries.find((l) => l.name.toLowerCase() === target);
      if (found) {
        console.info(`[ListenFaithfullySource] [${slot.name}] → "${found.name}" (${found.id})`);
        return found.id;
      }
      console.warn(`[ListenFaithfullySource] Library "${slot.libraryName}" not found; using first.`);
    }

    const first = libraries[0];
    console.info(`[ListenFaithfullySource] [${slot.name}] → first library "${first.name}" (${first.id})`);
    return first.id;
  }

  async _fetchAllLibraryItems(libraryId) {
    const items = [];
    let page = 0;
    const limit = 100;
    while (true) {
      const data  = await this._apiFetch(
        `/api/libraries/${libraryId}/items?limit=${limit}&page=${page}&expanded=1`
      );
      const batch = data?.results ?? [];
      items.push(...batch);
      if (batch.length < limit) break;
      page++;
    }
    return items;
  }

  _extractAudioFiles(item) {
    const media = item.media ?? {};
    if (Array.isArray(media.audioFiles) && media.audioFiles.length) return media.audioFiles;
    if (Array.isArray(media.episodes))
      return media.episodes.map((ep) => ep.audioFile).filter(Boolean);
    if (Array.isArray(item.libraryFiles))
      return item.libraryFiles.filter((f) =>
        /^audio\//i.test(f.fileType ?? f.metadata?.mimeType ?? "")
      );
    return [];
  }

  _buildStreamUrl(itemId, fileIno) {
    const q = this._token ? `?token=${encodeURIComponent(this._token)}` : "";
    return `${this._base}/api/items/${itemId}/file/${fileIno}${q}`;
  }

  async _apiFetch(path) {
    const sep = path.includes("?") ? "&" : "?";
    const url = this._token
      ? `${this._base}${path}${sep}token=${encodeURIComponent(this._token)}`
      : `${this._base}${path}`;

    // Note: token is sent via ?token= query param only.
    // Sending an Authorization header would trigger a CORS preflight that the
    // server rejects. The ?token= param is sufficient for all LF/ABS endpoints.
    const res = await fetch(url, { credentials: "include" });

    if (!res.ok) throw new Error(`[ListenFaithfullySource] API ${res.status} for ${url}`);
    return res.json();
  }

  /** Flush cached catalog for the current library (or all if idx is undefined). */
  invalidateCache(idx) {
    if (idx === undefined) {
      this._catalogs.clear();
      this._catalogPromises.clear();
    } else {
      this._catalogs.delete(idx);
      this._catalogPromises.delete(idx);
    }
  }
}
