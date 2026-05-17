import { BibleSource } from "./source.js";

/**
 * Resolves audio from a local/relative directory using a configurable URL template.
 *
 * Example config:
 *   { type: "local", baseUrl: "audio/kjv", pattern: "{book2}-{chapter3}.mp3" }
 * Resolves Genesis 1 → "audio/kjv/01-001.mp3"
 *
 * Placeholders:
 *   {book}     → bookId (e.g. 1)
 *   {book2}    → bookId zero-padded to 2 digits (e.g. 01)
 *   {book3}    → bookId zero-padded to 3 digits
 *   {chapter}  → chapter (e.g. 1)
 *   {chapter2} → chapter zero-padded to 2 digits
 *   {chapter3} → chapter zero-padded to 3 digits
 *   {abbr}     → 3-letter book abbreviation (e.g. GEN); requires books table
 */
export class LocalSource extends BibleSource {
  constructor({ baseUrl = "audio", pattern = "{book2}-{chapter3}.mp3", books = [] } = {}) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.pattern = pattern;
    this.books = books;
  }

  get name() { return `Local (${this.baseUrl})`; }

  _resolve(bookId, chapter) {
    const book = this.books.find(b => b.id === bookId);
    const abbr = book ? book.abbr.toLowerCase() : `b${bookId}`;
    const pad = (n, w) => String(n).padStart(w, "0");
    return this.pattern
      .replaceAll("{book3}",    pad(bookId, 3))
      .replaceAll("{book2}",    pad(bookId, 2))
      .replaceAll("{book}",     String(bookId))
      .replaceAll("{chapter3}", pad(chapter, 3))
      .replaceAll("{chapter2}", pad(chapter, 2))
      .replaceAll("{chapter}",  String(chapter))
      .replaceAll("{abbr}",     abbr);
  }

  async getAudioUrl(bookId, chapter) {
    return `${this.baseUrl}/${this._resolve(bookId, chapter)}`;
  }

  async hasAudio(bookId, chapter) {
    // HEAD probe — gives the controller a way to grey-out missing chapters
    // without downloading the file. Falls back to true on errors so playback
    // attempts still get a useful network error message later.
    const url = await this.getAudioUrl(bookId, chapter);
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return true;
    }
  }
}
