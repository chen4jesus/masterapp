// BibleSource — abstract contract every source adapter must implement.
// Adapters can be local file servers, third-party REST APIs, IndexedDB caches, etc.
// The device controller only talks to this interface.

export class BibleSource {
  /** Human-readable adapter name shown in debug strip. */
  get name() { return "Abstract"; }

  /**
   * Resolve a playable media URL for a given book/chapter.
   * Implementations may return a local path, signed S3 URL, blob URL, etc.
   * @param {number} bookId  1..66
   * @param {number} chapter 1..N
   * @returns {Promise<string|null>}
   */
  async getAudioUrl(bookId, chapter) { // eslint-disable-line no-unused-vars
    throw new Error("getAudioUrl not implemented");
  }

  /**
   * Optional: fetch verse text for a chapter. Not required for audio playback.
   * @returns {Promise<Array<{ num: number, text: string }>>}
   */
  async getVerses(bookId, chapter) { // eslint-disable-line no-unused-vars
    return [];
  }

  /**
   * Optional: report whether a given chapter has audio available, without fetching it.
   * Useful for greying out keypad confirmations once UI grows.
   */
  async hasAudio(bookId, chapter) {
    const url = await this.getAudioUrl(bookId, chapter);
    return !!url;
  }
}
