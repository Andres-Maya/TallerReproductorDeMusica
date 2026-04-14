# 🎵 Waveline — Backend API

REST API for the Waveline Music Playlist Player, built in **TypeScript** with **Node.js + Express**.

---

## Project Structure

```
waveline-backend/
├── src/
│   ├── domain/
│   │   ├── Song.ts              # Song entity + DTO + validation
│   │   └── Playlist.ts          # Playlist aggregate root
│   ├── data-structures/
│   │   ├── TrackNode.ts         # DLL node (= "Node" from spec)
│   │   └── TrackList.ts         # Doubly Linked List (= "DoublyLinkedList")
│   ├── services/
│   │   └── PlaylistManager.ts   # Business logic facade + domain errors
│   ├── controllers/
│   │   ├── PlaylistController.ts
│   │   └── SongController.ts
│   ├── routes/
│   │   └── index.ts             # Route wiring
│   ├── middlewares/
│   │   └── errorHandler.ts      # Logger, 404, global error boundary
│   ├── utils/
│   │   ├── ApiResponse.ts       # Standardised JSON response helpers
│   │   └── paramHelper.ts       # Express param type normaliser
│   ├── app.ts                   # Express factory (testable, port-free)
│   └── server.ts                # Entry point + demo seed
├── dist/                        # Compiled output (git-ignored)
├── .env.example
├── tsconfig.json
└── package.json
```

---

## Architecture

```
HTTP Request
     │
     ▼
[ Express Router ]   ← routes/index.ts
     │
     ▼
[ Controller ]       ← HTTP concerns only (parse body, call service, format response)
     │
     ▼
[ PlaylistManager ]  ← All business logic, owns state
     │
     ▼
[ TrackList ]        ← Doubly Linked List data structure
     │
     ▼
[ TrackNode ]        ← DLL node
     │
     ▼
[ Song ]             ← Pure value object / entity
```

### OOP Principles

| Principle | Where |
|-----------|-------|
| **Encapsulation** | `TrackList` private `#head/#tail/#size`; `PlaylistManager` private `Map` stores |
| **Abstraction** | Controllers never touch `TrackList` — only `PlaylistManager` API |
| **Single Responsibility** | Each class has one job; controllers are thin HTTP adapters |
| **Open/Closed** | `PlaylistManager` store could be swapped for a DB adapter via DI without changing callers |
| **Dependency Inversion** | `PlaylistManager` is injected into controllers, not instantiated inside them |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env

# 3. Start development server (hot-reload)
npm run dev

# 4. Or compile and run production build
npm run build
npm start
```

Server starts at **http://localhost:3000** and seeds two demo playlists on startup.

---

## API Reference

All endpoints are prefixed with `/api/v1`.

Every response follows this envelope:
```json
{ "success": true,  "data": { ... }, "meta": { ... } }
{ "success": false, "error": "message", "details": [...] }
```

---

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |

---

### Playlists

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/playlists` | List all playlists |
| `POST` | `/api/v1/playlists` | Create a playlist |
| `GET` | `/api/v1/playlists/:id` | Get playlist + songs |
| `PATCH` | `/api/v1/playlists/:id` | Rename playlist |
| `DELETE` | `/api/v1/playlists/:id` | Delete playlist |

**Create playlist body:**
```json
{ "name": "My Playlist" }
```

---

### Songs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/playlists/:id/songs` | List songs in order |
| `POST` | `/api/v1/playlists/:id/songs` | Add song |
| `DELETE` | `/api/v1/playlists/:id/songs/:songId` | Remove song |

**Add song body:**
```json
{
  "title":    "Jazz in Paris",
  "artist":   "Media Right Productions",
  "audioUrl": "https://example.com/track.mp3",
  "position": "end"
}
```

`position` options:
- `"end"` (default) — append to tail — O(1)
- `"start"` — prepend to head — O(1)
- `number` — insert at 1-based index (clamped) — O(n)

---

### Player / Playback

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/playlists/:id/player` | Full playback state |
| `GET` | `/api/v1/playlists/:id/player/current` | Current song only |
| `POST` | `/api/v1/playlists/:id/player/play/:songId` | Play specific song |
| `POST` | `/api/v1/playlists/:id/player/next` | Advance (wraps to head) |
| `POST` | `/api/v1/playlists/:id/player/previous` | Step back (wraps to tail) |

**Playback state response:**
```json
{
  "success": true,
  "data": {
    "playlistId":   "pl_...",
    "playlistName": "My Playlist",
    "totalTracks":  4,
    "currentIndex": 1,
    "currentSong":  { "id": "...", "title": "...", "artist": "...", "audioUrl": "..." },
    "hasPrevious":  true,
    "hasNext":      true
  }
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `204` | No Content (DELETE) |
| `400` | Bad Request / Validation Error |
| `404` | Not Found |
| `500` | Internal Server Error |

---

## Deployment

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init
railway up
```
Set `PORT` env var in the Railway dashboard (it injects it automatically).

### Render
1. Connect your GitHub repo at render.com
2. Build command: `npm run build`
3. Start command: `npm start`
4. Add env var `PORT=3000`

### Heroku
```bash
heroku create waveline-api
heroku config:set NODE_ENV=production
git push heroku main
```

Add a `Procfile` at the root:
```
web: npm start
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Hot-reload dev server via ts-node-dev |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled production build |
| `npm run typecheck` | Type-check without emitting |
