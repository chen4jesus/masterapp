// Thin wrapper around <audio> that exposes a small Observable-style API.
// The device controller listens for time/ended/error events and updates the display.

export class Player {
  constructor(audioEl) {
    this.audio = audioEl;
    this.listeners = new Map();

    audioEl.addEventListener("play",     () => this._emit("play"));
    audioEl.addEventListener("pause",    () => this._emit("pause"));
    audioEl.addEventListener("ended",    () => this._emit("ended"));
    audioEl.addEventListener("timeupdate", () => this._emit("time", audioEl.currentTime));
    audioEl.addEventListener("loadedmetadata", () => this._emit("loaded", audioEl.duration));
    audioEl.addEventListener("error",    () => this._emit("error", audioEl.error));
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.listeners.get(event).delete(fn);
  }

  _emit(event, payload) {
    const set = this.listeners.get(event);
    if (set) for (const fn of set) fn(payload);
  }

  async load(url) {
    this.audio.src = url;
    this.audio.load();
  }

  async play() {
    try { await this.audio.play(); }
    catch (err) { this._emit("error", err); }
  }

  pause() { this.audio.pause(); }

  get isPlaying() { return !this.audio.paused && !this.audio.ended; }
  get currentTime() { return this.audio.currentTime; }
  get duration() { return this.audio.duration; }

  reset() {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }
}
