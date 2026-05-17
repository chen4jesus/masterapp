// Renders to the on-device LCD. Only the device controller calls these methods.
// Keeping it dumb (no app state) makes the controller's state machine easier to follow.

export class Display {
  /**
   * @param {Element} root        The [data-lcd] element.
   * @param {Element} bookBtn     The 书卷 button ([data-key="book"]).
   * @param {Element} chapterBtn  The 章节 button ([data-key="chapter"]).
   * @param {Element} [indicator] The top-right power indicator dot.
   */
  constructor(root, bookBtn, chapterBtn, indicator = null) {
    this.root       = root;
    this.elPlay     = root.querySelector('[data-lcd-play]');
    this.elMode     = root.querySelector('[data-lcd-mode]');
    this.elMain     = root.querySelector('[data-lcd-main]');
    this.elLabel    = root.querySelector('[data-lcd-label]');
    this._bookBtn   = bookBtn;
    this._chapBtn   = chapterBtn;
    this._indicator = indicator;
    this._confirmEl = null;   // whichever button is currently in hint state
  }

  setPower(on) {
    this.root.dataset.power = on ? "on" : "off";
  }

  setPlaying(playing) {
    this.root.dataset.playing = playing ? 'true' : 'false';
    if (this._indicator) {
      this._indicator.classList.toggle('indicator--playing', playing);
    }
  }

  setMode(text) {
    this.elMode.textContent = text;
  }

  setMain(text) {
    this.stopScroll();
    this.elMain.textContent = text;
  }

  setLabel(text) {
    this.elLabel.textContent = text;
  }

  setEntry(active) {
    this.root.dataset.entry = active ? "true" : "false";
  }

  flash(text, durationMs = 900) {
    const previous      = this.elMain.textContent;
    const previousLabel = this.elLabel.textContent;
    this.stopScroll();
    this.elMain.textContent = text;
    this.setLabel("");
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => {
      this.elMain.textContent = previous;
      this.setLabel(previousLabel);
    }, durationMs);
  }

  /**
   * Light up the 书卷 or 章节 button in "confirm" mode:
   * - Turns it bright amber with a pulsing glow
   * - Replaces its text label with '确认'
   * Calling again with a different key swaps the active button.
   * @param {'book'|'chapter'} key
   */
  setConfirmHint(key) {
    this.clearConfirmHint();  // always clean up previous state first
    const btn = key === "book" ? this._bookBtn : this._chapBtn;
    if (!btn) return;
    btn._savedText = btn.textContent;
    btn.textContent = "确认";
    btn.classList.add("key--confirm");
    this._confirmEl = btn;
  }

  /**
   * Remove the confirm hint from whichever button is currently showing it,
   * restoring its original label.
   */
  clearConfirmHint() {
    if (!this._confirmEl) return;
    this._confirmEl.textContent = this._confirmEl._savedText ?? "";
    this._confirmEl.classList.remove("key--confirm");
    this._confirmEl = null;
  }

  /**
   * Display `text` with a marquee scroll animation if it's wider than the LCD.
   * Measures the actual rendered width to calculate the exact scroll distance.
   * @param {string} text  Full track / item name to display.
   */
  startScroll(text) {
    this.stopScroll();

    // Put a measuring span in the DOM (off-screen) to get real pixel width
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;visibility:hidden;white-space:nowrap;" +
      "font-family:'Share Tech Mono',monospace;font-size:30px;letter-spacing:0.18em;";
    probe.textContent = text;
    document.body.appendChild(probe);
    const textPx    = probe.offsetWidth;
    const containerPx = this.elMain.offsetWidth;
    document.body.removeChild(probe);

    // Replace content with an inner span that will animate
    this.elMain.textContent = "";
    const span = document.createElement("span");
    span.textContent = text;

    if (textPx <= containerPx) {
      // Fits — no animation needed
      this.elMain.appendChild(span);
      return;
    }

    // Scroll distance: move left until the end of the text is visible,
    // plus a small gap before looping (shows a brief blank before restart).
    const scrollPx  = -(textPx - containerPx + 24);
    // Duration: ~60px per second feels natural for a reading-speed scroll
    const durationS = Math.max(6, Math.abs(scrollPx) / 60);

    span.classList.add("lcd__main--scroll");
    span.style.setProperty("--scroll-px", `${scrollPx}px`);
    span.style.setProperty("--scroll-dur", `${durationS.toFixed(1)}s`);
    this.elMain.appendChild(span);
  }

  /**
   * Stop any active marquee and clear the inner span.
   * Called automatically by setMain() and flash().
   */
  stopScroll() {
    const span = this.elMain.querySelector(".lcd__main--scroll");
    if (span) {
      span.remove();
      this.elMain.textContent = "";
    }
  }
}
