# Bible Radio — SPA

A vanilla HTML/CSS/JS single-page app styled as a handheld audio Bible player.
The UI is a photoreal-skeuomorphic device with a glowing cross, segmented LCD,
numeric keypad, and transport row. Audio is streamed live from a
**ListenFaithfully / Audiobookshelf** backend.

**Live:** `https://radio.faithconnect.us`

---

## Features

### Multi-library (频道) switching
The **频道** (Channel) button cycles through all libraries defined in
`config.json`. Libraries can be in one of two scan modes:

| `scanMode`   | Use case                  | How position maps to audio                              |
|--------------|---------------------------|---------------------------------------------------------|
| `pattern`    | Chinese Union Version Bible | Regex extracts `<book>` + `<chapter>` from the filename |
| `sequential` | Sermons, hymns, playlists | Tracks are numbered in order (book=track, ch=1)         |

### Mode-aware LCD display
- **Bible mode** (`pattern`) — LCD shows the Chinese book abbreviation and
  three-digit chapter (e.g. `创 001`).
- **Playlist mode** (`sequential`) — LCD shows the track title fetched from the
  catalog. Long titles auto-scroll with a smooth marquee animation.

### Confirm-hint buttons
When entering a book or chapter number, the **书卷** / **章节** button turns
bright amber and displays **确认**, prompting the user to press it again to
confirm. On invalid entry the button resets immediately.

### Smart invalid-entry fallback
- After confirming any book/chapter, the catalog is checked asynchronously.
- If no audio file exists for that position the LCD flashes **无音频**, the
  button resets, and the display reverts to the last successfully-played
  position — no user action required.
- The fallback also correctly detects whether audio is still playing in the
  background and preserves the play/pause state rather than forcing IDLE.

### Auto-play on confirm
Confirming a valid book/chapter (or switching channels) starts playback
automatically — no need to press ▶ separately.

### Keyboard shortcuts

| Key              | Action                                                          |
|------------------|-----------------------------------------------------------------|
| `0`–`9`          | Type into the digit buffer (defaults to chapter entry)          |
| `b`              | Enter book-select mode; press again (or ▶) to confirm           |
| `c`              | Enter chapter-select mode; press again (or ▶) to confirm        |
| `←` / `→`        | Previous / next chapter (wraps across books)                    |
| `Space` / `Enter`| Play, pause, or confirm a pending entry and play                |
| `m`              | Cycle to the next library. Press while off to power on.         |

Typing digits during playback immediately starts a chapter entry — matching
the behaviour of the physical device.

---

## Configuration (`config.json`)

Runtime config fetched by the browser. The factory in
[`scripts/sources/index.js`](scripts/sources/index.js) dispatches on
`source.type`.

```jsonc
{
  "source": {
    "type": "listenfaithfully",
    "baseUrl": "https://listen.faithconnect.us/listenfaithfully",
    "token": "YOUR_API_TOKEN",

    // Libraries are cycled by the 频道 button, in order.
    "libraries": [
      {
        "name": "圣经",
        "libraryName": "bible",
        "scanMode": "pattern",
        "filePattern": "(?<book>\\d+)-(?<chapter>\\d+)"
      },
      {
        "name": "讲道",
        "libraryName": "sermons",
        "scanMode": "sequential"
      },
      {
        "name": "诗歌",
        "libraryName": "hymns",
        "scanMode": "sequential"
      }
    ]
  },

  "ui": {
    "debug": false,       // shows a state strip below the device
    "startBook": 1,
    "startChapter": 1
  }
}
```

### `source` fields

| Field         | Required | Description |
|---------------|----------|-------------|
| `type`        | ✅       | Always `"listenfaithfully"` for the live stack |
| `baseUrl`     | ✅       | Origin + router base path of your LF instance, no trailing slash |
| `token`       | ✅       | API token from LF Settings → API Keys. Sent as `?token=` query param |
| `libraries`   | ✅       | Ordered list of libraries the 频道 button cycles through |

### Library fields

| Field          | Required for `pattern` | Description |
|----------------|------------------------|-------------|
| `name`         | ✅                     | Display label shown in top-bar of LCD and in 频道 flash |
| `libraryName`  | ✅                     | Exact name of the library in ListenFaithfully |
| `scanMode`     | ✅                     | `"pattern"` or `"sequential"` |
| `filePattern`  | ✅ (pattern only)       | Regex with named groups `<book>` and `<chapter>` |

### Bible file naming convention

For `scanMode: "pattern"`, audio files must be named so the regex can extract
book and chapter numbers. The default pattern `(?<book>\d+)-(?<chapter>\d+)`
matches:

```
01-001.mp3   → Genesis ch. 1
01-002.mp3   → Genesis ch. 2
19-150.mp3   → Psalms ch. 150
66-022.mp3   → Revelation ch. 22
```

Library structure inside ListenFaithfully doesn't matter (one item per book,
one giant item, etc.) — the source scans everything and builds an in-memory
index at startup.

---

## Adding a custom audio source

1. Create `scripts/sources/myThing.js` extending `BibleSource`.  
   Implement `getAudioUrl(bookId, chapter)` at minimum.
2. Register it in [`scripts/sources/index.js`](scripts/sources/index.js):
   ```js
   case "myThing": return new MyThingSource(opts);
   ```
3. Reference it from `config.json`:
   ```json
   { "source": { "type": "myThing" } }
   ```

The device controller never imports source classes directly — only the factory
does.

---

## Running locally (dev)

No build, no installs. Serve the folder with any static server:

```bash
npx -y serve . --listen 8765
# → http://localhost:8765
```

ES modules require an HTTP origin — opening `index.html` directly from the
file system will fail due to browser CORS rules on `import`.

The local `config.json` points at `http://localhost:8003/listenfaithfully`
(the ListenFaithfully Docker service). Make sure it's running and that
`ALLOW_CORS=1` is set in its environment.

---

## Docker deployment

The app ships as a static Caddy file server. No Node.js runtime required.

### Production (`radio.faithconnect.us`)

```bash
# 1. Set the production API token in config.production.json
# 2. Build and start
cd bible_spa
docker compose -f docker-compose.app.yml up -d --build

# 3. Reload Caddy (Caddyfile already contains the radio.faithconnect.us block)
docker exec faithconnect-caddy caddy reload --config /etc/caddy/Caddyfile
```

### Local Docker (port 8005)

```bash
# Start the core infrastructure first (if not already running)
docker compose -f docker-compose.local.yml up -d

# Build and start bible-spa
cd bible_spa
docker compose -f docker-compose.app.yml up -d --build
# → http://localhost:8005
```

> The production Docker build copies `config.production.json` over
> `config.json` automatically so the browser always gets the correct
> `https://listen.faithconnect.us` base URL.

---

## File layout

```
bible_spa/
├── Dockerfile                  — Caddy static server (production)
├── docker-compose.app.yml      — joins the faithconnect Docker network
├── config.json                 — local dev config (localhost LF)
├── config.production.json      — production config (live LF API)
├── index.html
├── styles/
│   ├── reset.css
│   ├── device.css              — chassis, speaker grille, glowing cross
│   ├── display.css             — LCD module + marquee scroll animation
│   └── buttons.css             — keypad + transport buttons + confirm pulse
└── scripts/
    ├── main.js                 — bootstrap: loads config, wires buttons & keyboard
    ├── device.js               — state machine (IDLE / ENTER_BOOK / ENTER_CHAPTER
    │                             / PLAYING / PAUSED); owns all app logic
    ├── display.js              — LCD render helpers, marquee scroll, confirm hint
    ├── player.js               — <audio> wrapper with an event-emitter API
    ├── books.js                — 66-book Chinese Union Version table
    │                             (id, abbr, chapter counts)
    └── sources/
        ├── source.js           — abstract BibleSource contract
        ├── mockSource.js       — no-op placeholder (flashes 无音频)
        ├── localSource.js      — pattern-based URL resolver for hosted files
        ├── listenfaithfullySource.js — live LF/ABS streaming with catalog cache
        └── index.js            — factory dispatching on config.source.type
```

---

## Known limitations / future ideas

- **Persistence** — last-played position is not saved across reloads. Wire
  `localStorage` into `Device._loadAndPlay`'s success path and `powerOn` to
  restore it.
- **Volume control** — the chassis has room; add a `volume` key and wire it
  to `player.audio.volume`.
- **Sleep timer / A-B repeat** — would extend the state machine and button
  row; the `input(key)` switch is the natural place to add them.
- **Verse-level navigation** — `BibleSource.getVerses` exists in the contract;
  nothing in the UI currently consumes it.
