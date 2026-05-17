import { MockSource } from "./mockSource.js";
import { LocalSource } from "./localSource.js";
import { ListenFaithfullySource } from "./listenfaithfullySource.js";
import { BOOKS } from "../books.js";

/**
 * Build a source adapter from a config object loaded from config.json
 * (or any other runtime mechanism — env-baked JSON, server response, etc.).
 *
 *   { "source": { "type": "mock" } }
 *   { "source": { "type": "local", "baseUrl": "audio/kjv", "pattern": "{abbr}/{chapter3}.mp3" } }
 *   { "source": { "type": "listenfaithfully", "baseUrl": "https://...", "token": "..." } }
 *
 * Add new types here. Keep the device controller untouched.
 */
export function createSource(config = {}) {
  const { type = "mock", ...opts } = config;
  switch (type) {
    case "local":
      return new LocalSource({ ...opts, books: BOOKS });
    case "listenfaithfully":
      return new ListenFaithfullySource({ ...opts, books: BOOKS });
    case "mock":
    default:
      return new MockSource();
  }
}
