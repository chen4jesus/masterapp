import { BibleSource } from "./source.js";

/**
 * Placeholder source. Returns no real audio — useful for UI development.
 * The device controller will display "NO AUDIO" when this returns null,
 * which is the intended skeleton behavior until a real source is configured.
 */
export class MockSource extends BibleSource {
  get name() { return "Mock (no audio)"; }

  async getAudioUrl(_bookId, _chapter) {
    return null;
  }

  async getVerses(_bookId, _chapter) {
    return [];
  }
}
