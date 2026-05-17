// Device — main state machine. Owns all UI state; talks to Display, Player, and
// the active BibleSource adapter. Inputs come from the keypad/transport via .input().

import { BOOKS, getBookById } from "./books.js";

const STATE = Object.freeze({
  OFF: "OFF",
  IDLE: "IDLE",
  ENTER_BOOK: "ENTER_BOOK",
  ENTER_CHAPTER: "ENTER_CHAPTER",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
});

// Fallback mode labels used when the source doesn't support library switching
const MODES = ["BIBLE", "PSALM", "NT"];

export class Device {
  constructor({ display, player, source, crossEl, playGlyph, debug }) {
    this.display = display;
    this.player = player;
    this.source = source;
    this.crossEl = crossEl;
    this.playGlyph = playGlyph;
    this.debug = debug;

    this.state = STATE.OFF;
    this.book = 1;     // bookId
    this.chapter = 1;
    this.buffer = "";  // numeric input buffer
    this.modeIndex = 0;
    // Seed the LCD mode label from the source if it supports it
    this._initialModeName = null;
    // Last position that successfully produced audio — used to recover the
    // display when the user navigates to a position with no audio file.
    this._lastGoodBook    = 1;
    this._lastGoodChapter = 1;

    this._bindPlayer();
  }

  // --------------------------------------------------------------------- API
  powerOn() {
    this.state = STATE.IDLE;
    this.display.setPower(true);
    // Use the source's current library name if available, otherwise fallback mode
    const modeName = this.source.modeName ?? MODES[this.modeIndex];
    this.display.setMode(modeName);
    // Treat the starting position as "good" until proven otherwise
    this._lastGoodBook    = this.book;
    this._lastGoodChapter = this.chapter;
    this._refreshIdle();
    this._setCross(true);
    this._syncDebug();
  }

  powerOff() {
    this.player.pause();
    this.state = STATE.OFF;
    this.display.setPower(false);
    this.display.setMain("");
    this.display.setLabel("OFF");
    this.display.setPlaying(false);
    this._setCross(false);
    this._syncDebug();
  }

  /** Single entry-point from the UI for every button press. */
  input(key) {
    if (this.state === STATE.OFF && key !== "mode") return;

    switch (key) {
      case "0": case "1": case "2": case "3": case "4":
      case "5": case "6": case "7": case "8": case "9":
        return this._onDigit(key);
      case "book":    return this._onBook();
      case "chapter": return this._onChapter();
      case "prev":    return this._onPrev();
      case "next":    return this._onNext();
      case "play":    return this._onPlay();
      case "mode":    return this._onMode();
    }
  }

  // ----------------------------------------------------------------- inputs
  _onDigit(d) {
    if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
      // Typing during playback hops into chapter entry — like the real device.
      this.state = STATE.ENTER_CHAPTER;
      this.buffer = "";
      this.display.setConfirmHint("chapter");
    } else if (this.state === STATE.IDLE) {
      this.state = STATE.ENTER_CHAPTER;
      this.buffer = "";
      this.display.setConfirmHint("chapter");
    }

    if (this.buffer.length < 3) this.buffer += d;
    this._renderEntry();
  }

  _onBook() {
    if (this.state === STATE.ENTER_BOOK && this.buffer) {
      // Second press with digits buffered — confirm the book selection
      const id = clamp(parseInt(this.buffer, 10), 1, 66);
      this.book    = id;
      this.chapter = 1;
      this.buffer  = "";
      this.state   = STATE.IDLE;
      this.display.clearConfirmHint();
      this._renderIdle();
      this._validatePosition(id, 1); // async: revert if no audio at book N ch 1
      return;
    }
    // First press (or repeat press with no digits) — enter book-entry mode
    this.state = STATE.ENTER_BOOK;
    this.buffer = "";
    this.display.setConfirmHint("book");
    this._renderEntry();
  }

  _onChapter() {
    if (this.state === STATE.ENTER_CHAPTER && this.buffer) {
      // Second press with digits buffered — confirm the chapter selection
      const max = getBookById(this.book)?.chapters ?? 1;
      const ch  = clamp(parseInt(this.buffer, 10), 1, max);
      this.chapter = ch;
      this.buffer  = "";
      this.state   = STATE.IDLE;
      this.display.clearConfirmHint();
      this._renderIdle();
      this._validatePosition(this.book, ch); // async: revert if no audio
      return;
    }
    // First press — enter chapter-entry mode
    this.state = STATE.ENTER_CHAPTER;
    this.buffer = "";
    this.display.setConfirmHint("chapter");
    this._renderEntry();
  }

  _onPrev() {
    this.display.clearConfirmHint();
    if (this.chapter > 1) {
      this.chapter -= 1;
    } else if (this.book > 1) {
      this.book -= 1;
      this.chapter = getBookById(this.book).chapters;
    }
    this._afterNavigate();
  }

  _onNext() {
    this.display.clearConfirmHint();
    const max = getBookById(this.book)?.chapters ?? 1;
    if (this.chapter < max) {
      this.chapter += 1;
    } else if (this.book < 66) {
      this.book += 1;
      this.chapter = 1;
    }
    this._afterNavigate();
  }

  _onPlay() {
    // Confirm any pending entry first
    if (this.state === STATE.ENTER_BOOK)    { this._onBook(); return this._onPlay(); }
    if (this.state === STATE.ENTER_CHAPTER) { this._onChapter(); return this._onPlay(); }

    if (this.state === STATE.PLAYING) {
      this.player.pause();
      return;
    }
    if (this.state === STATE.PAUSED) {
      this.player.play();
      return;
    }
    this._loadAndPlay();
  }

  _onMode() {
    this.display.clearConfirmHint();
    if (this.state === STATE.OFF) {
      this.powerOn();
      return;
    }

    // If the source supports library switching, use it
    if (typeof this.source.nextLibrary === "function") {
      // Stop current playback so stale audio doesn't continue into the new library
      if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
        this.player.pause();
        this.player.reset();
        this.state = STATE.IDLE;
        this.display.setPlaying(false);
        this.playGlyph.textContent = "▶";
      }

      // Switch to the next library slot
      const slot = this.source.nextLibrary();
      const label = (slot.name ?? "LIB").toUpperCase();
      this.display.setMode(label);

      // Show the library name on the main LCD for 900 ms, then load the
      // new library's first item.  We deliberately avoid display.flash() here
      // because flash() saves-and-restores the *old* main text after its
      // timer fires, which would overwrite _refreshIdle()'s output and leave
      // the previous library's position on screen.
      this.display.stopScroll();
      this.display.setMain(label);
      this.display.setLabel("");

      // Reset to position 1:1 in the new library
      this.book    = 1;
      this.chapter = 1;
      this.buffer  = "";
      this.state   = STATE.IDLE;
      // Reset the fallback anchor so an invalid entry in the new library
      // doesn't revert to a position from the previous library.
      this._lastGoodBook    = 1;
      this._lastGoodChapter = 1;

      // After the banner clears, auto-play the new library's first item.
      // _loadAndPlay() awaits the catalog (cached after first switch), then
      // loads and plays without requiring a manual ▶ press.
      setTimeout(() => this._loadAndPlay(), 900);
      this._syncDebug();
      return;
    }

    // Fallback: cycle static mode labels
    this.modeIndex = (this.modeIndex + 1) % MODES.length;
    this.display.setMode(MODES[this.modeIndex]);
    this.display.flash(MODES[this.modeIndex], 600);
  }

  // --------------------------------------------------------------- internal

  /**
   * Called after every confirmed position entry (书卷/章节 confirm).
   * Async-checks the catalog:
   *  - Audio found + still idle → auto-play immediately (no need to press ▶)
   *  - Audio not found          → revert to last known-good position
   * A snapshot guard prevents stale actions if the user navigates away
   * before the catalog promise resolves.
   */
  async _validatePosition(book, chapter) {
    const url = await this.source.getAudioUrl(book, chapter);
    // Guard: user may have already changed position while we were awaiting
    if (this.book !== book || this.chapter !== chapter) return;
    if (!url) {
      this._revertToLastGood();
      return;
    }
    // Audio confirmed — start playing immediately if the user hasn't already
    // pressed ▶ themselves (which would have set state to PLAYING).
    if (this.state === STATE.IDLE) {
      this._loadAndPlay();
    }
  }

  /** Shared revert: flash the error, reset confirm buttons, and restore the last playable position. */
  _revertToLastGood() {
    this.display.flash("无音频", 1400);
    this.display.clearConfirmHint();   // restore 书卷 / 章节 label immediately
    this.book    = this._lastGoodBook;
    this.chapter = this._lastGoodChapter;

    // Re-sync the state machine to the actual player state.
    // The user may have entered invalid digits while audio was still playing;
    // in that case the player never stopped — don't mark it as IDLE.
    const audioEl = this.player.audio;
    const stillPlaying = audioEl && !audioEl.paused && !audioEl.ended && audioEl.readyState > 0;

    if (stillPlaying) {
      this.state = STATE.PLAYING;
      this.display.setPlaying(true);
      this.playGlyph.textContent = "❚❚";
      // After the flash clears, redraw the reverted position.
      // The ongoing `timeupdate` events will keep the timer ticking naturally.
      setTimeout(() => {
        this.display.setEntry(false);
        if (this.source.isBibleMode !== false) {
          const book = getBookById(this.book);
          this.display.setMain(`${book.abbr} ${pad(this.chapter, 3)}`);
        } else {
          // Playlist mode: restart the track-name scroll for the reverted position
          this._refreshIdle();
        }
      }, 1450);
    } else {
      this.state = STATE.IDLE;
      this.display.setPlaying(false);
      this.playGlyph.textContent = "▶";
      setTimeout(() => this._refreshIdle(), 1450);
    }

    this._syncDebug();
  }

  async _loadAndPlay() {
    const url = await this.source.getAudioUrl(this.book, this.chapter);
    if (!url) {
      this._revertToLastGood();
      return;
    }
    // In playlist mode, show the track name before/during playback
    if (this.source.isBibleMode === false) {
      this._refreshIdle(); // fire-and-forget; fills in name as soon as catalog resolves
    }
    await this.player.load(url);
    await this.player.play();
  }


  _afterNavigate() {
    this.buffer = "";
    if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
      this._loadAndPlay();
    } else {
      this.state = STATE.IDLE;
      this._refreshIdle();
    }
    this._syncDebug();
  }

  /**
   * Async: fetches the track name from the source (if playlist mode) then
   * either starts the marquee scroll or shows the standard book+chapter label.
   * Fire-and-forget from sync call sites; safe to call multiple times.
   */
  async _refreshIdle() {
    this.display.setEntry(false);
    this.display.setLabel("READY");

    // Playlist mode: show track name with optional scroll
    if (typeof this.source.getTrackName === "function" && this.source.isBibleMode === false) {
      const name = await this.source.getTrackName(this.book, this.chapter);
      if (name) {
        this.display.startScroll(name);
      } else {
        // Catalog not yet ready or position out of range — show a neutral label
        this.display.setMain("...");
      }
      this._syncDebug();
      return;
    }

    // Bible mode or non-LF source: show book abbreviation + chapter
    this._renderIdle();
  }

  _renderIdle() {
    this.display.setEntry(false);
    const book = getBookById(this.book);
    this.display.setMain(`${book.abbr} ${pad(this.chapter, 3)}`);
    this.display.setLabel("READY");
    this._syncDebug();
  }

  _renderEntry() {
    this.display.setEntry(true);
    const prefix = this.state === STATE.ENTER_BOOK ? "B" : "C";
    const width  = this.state === STATE.ENTER_BOOK ? 2   : 3;
    const buf = this.buffer.padStart(width, "-");
    this.display.setMain(`${prefix} ${buf}`);
    this.display.setLabel(this.state === STATE.ENTER_BOOK ? "书卷" : "章节");
    this._syncDebug();
  }

  _renderPlayback(timeSec) {
    const mm = Math.floor(timeSec / 60);
    const ss = Math.floor(timeSec % 60);
    this.display.setEntry(false);
    // In playlist mode the track name is already scrolling on the main row;
    // just update the time label. In Bible mode (or other sources), show book+chapter.
    if (this.source.isBibleMode !== false) {
      const book = getBookById(this.book);
      this.display.setMain(`${book.abbr} ${pad(this.chapter, 3)}`);
    }
    this.display.setLabel(`${pad(mm, 2)}:${pad(ss, 2)}`);
  }


  _bindPlayer() {
    this.player.on("play",  () => {
      this.state = STATE.PLAYING;
      this.display.setPlaying(true);
      this.playGlyph.textContent = "❚❚";
      // Stamp the last known-good position now that audio is confirmed playing
      this._lastGoodBook    = this.book;
      this._lastGoodChapter = this.chapter;
      this._syncDebug();
    });
    this.player.on("pause", () => {
      // ended fires pause first; let "ended" handler win in that case
      if (this.player.audio.ended) return;
      this.state = STATE.PAUSED;
      this.display.setPlaying(false);
      this.playGlyph.textContent = "▶";
      this._syncDebug();
    });
    this.player.on("ended", () => {
      this.state = STATE.IDLE;
      this.display.setPlaying(false);
      this.playGlyph.textContent = "▶";
      this._onNext();
      this._loadAndPlay();
    });
    this.player.on("time",  (t) => {
      if (this.state === STATE.PLAYING) this._renderPlayback(t);
    });
    this.player.on("error", () => {
      this.display.flash("ERR", 1000);
      this.state = STATE.IDLE;
      this.display.setPlaying(false);
      this.playGlyph.textContent = "▶";
      this._renderIdle();
    });
  }

  _setCross(on) {
    if (!this.crossEl) return;
    this.crossEl.dataset.cross = on ? "on" : "off";
  }

  _syncDebug() {
    if (!this.debug) return;
    this.debug.state.textContent = this.state;
    this.debug.source.textContent = this.source.name ?? "?";
    const book = getBookById(this.book);
    this.debug.now.textContent = `${book.name} ${this.chapter}`;
  }
}

function pad(n, w) { return String(n).padStart(w, "0"); }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
