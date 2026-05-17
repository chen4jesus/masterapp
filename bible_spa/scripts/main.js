import { Display } from "./display.js";
import { Player } from "./player.js";
import { Device } from "./device.js";
import { createSource } from "./sources/index.js";

async function loadConfig() {
  try {
    const res = await fetch("config.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.warn("[bible_spa] config.json not loadable, falling back to defaults:", err);
    return { source: { type: "mock" }, ui: { debug: false } };
  }
}

function $(sel, root = document) { return root.querySelector(sel); }

async function boot() {
  const config = await loadConfig();
  const source = createSource(config.source);

  const display = new Display(
    $("[data-lcd]"),
    $("[data-key='book']"),
    $("[data-key='chapter']"),
  );
  const player  = new Player($("[data-audio]"));

  const debugEl = $("[data-debug]");
  const showDebug = !!config.ui?.debug;
  if (showDebug) debugEl.hidden = false;

  const device = new Device({
    display,
    player,
    source,
    crossEl: $("[data-cross]"),
    playGlyph: $("[data-play-glyph]"),
    debug: showDebug ? {
      state:  $("[data-debug-state]",  debugEl),
      source: $("[data-debug-source]", debugEl),
      now:    $("[data-debug-now]",    debugEl),
    } : null,
  });

  // Seed initial position from config (falls within valid range; no validation needed)
  if (Number.isInteger(config.ui?.startBook))    device.book    = config.ui.startBook;
  if (Number.isInteger(config.ui?.startChapter)) device.chapter = config.ui.startChapter;
  device.powerOn();

  // Wire all buttons through a single delegated handler
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-key]");
    if (!btn) return;
    device.input(btn.dataset.key);
    pulse(btn);
  });

  // Keyboard parity for desktop users
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    const map = {
      "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
      "b":"book", "书卷":"book",
      "c":"chapter", "章节":"chapter",
      "ArrowLeft":"prev", "ArrowRight":"next",
      " ":"play", "Enter":"play",
      "m":"mode", "M":"mode",
    };
    const key = map[e.key];
    if (!key) return;
    e.preventDefault();
    device.input(key);
    const btn = document.querySelector(`[data-key="${key}"]`);
    if (btn) pulse(btn);
  });

  // Expose for ad-hoc console debugging
  window.__bible = { device, source, config };
}

function pulse(btn) {
  btn.dataset.pressed = "true";
  setTimeout(() => { delete btn.dataset.pressed; }, 90);
}

boot();
