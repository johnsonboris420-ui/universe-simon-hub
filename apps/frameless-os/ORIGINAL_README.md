# FRAMELESS OS

## Overview

FRAMELESS OS — a full-stack investor-grade web application for a self-healing, AI-guarded, child-protecting operating system. Built as a **Windows-like desktop OS shell** with a cyberpunk dark theme (electric cyan on near-black), connected to live PostgreSQL data through an Express API.

**Live URLs (in Replit preview):**
- Frontend (desktop OS): `/`
- API server: `/api/...`

## Architecture

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

### Frontend: `artifacts/frameless-os`
React + Vite running on port 8081. Windows-like desktop OS shell with:
- **Boot animation** (`src/pages/boot.tsx`) — BIOS-style terminal boot sequence, auto-advances to desktop
- **Desktop shell** (`src/components/desktop/`) — Window manager, taskbar, start menu, desktop icons, context menu
- **Window manager** — Draggable windows with minimize/maximize/close, z-index management
- **Taskbar** — Start menu, pinned apps, notification bell with live count, clock
- **NotificationSystem** — SSE-powered live security alerts from the API server
- **App suite** (`src/components/apps/`):
  - `BrowserApp` — Real URL scanning via `/api/browser/scan`, shows security analysis
  - `FileExplorerApp` — Database-backed filesystem via `/api/fs/*`, supports create/read/delete files
  - `SlideshowApp` — 10-slide investor deck
  - `SecurityMonitorApp` — Real-time threat dashboard, AI agents, live DB data
  - `TerminalApp` — Real terminal connected to `/api/terminal/exec`, DB-backed `threats`, `agents`, `nodes`, `status`, `sysinfo`
  - `AiAssistant` (ARIA) — Real OpenAI GPT-5-mini chat via streaming SSE (`/api/aria/chat`)
  - `SystemMonitorApp` — Live CPU/RAM/disk/process data from `/api/system/metrics` (real `os` module)
  - `SettingsApp` — Interactive OS settings with toggles
  - `FramelessSite` — FRAMELESS marketing homepage as browser default

### API: `artifacts/api-server`
Express 5 API running on port 8080. Routes:
- `GET /api/dashboard/summary` — Dashboard summary stats
- `GET /api/threats` — Threat database (PostgreSQL)
- `POST /api/threats` — Create new threat
- `GET /api/threats/stats` — Threat statistics by category/severity
- `GET /api/agents` — AI agent list
- `GET /api/nodes` — Mesh network nodes
- `GET /api/events` — Security event log
- `GET /api/healing` — Self-heal event log
- `GET /api/platforms` — Platform list
- `POST /api/browser/scan` — URL security scanner (SSL/trackers/threats)
- `POST /api/aria/chat` — ARIA AI chat (OpenAI GPT-5-mini, SSE streaming)
- `GET /api/system/metrics` — Real CPU, RAM, disk, process data from Node.js `os` module
- `GET /api/system/info` — OS and server info
- `GET /api/system/events/stream` — SSE event stream for live security notifications
- `POST /api/terminal/exec` — Safe sandboxed terminal command execution (whitelisted + DB-backed commands)
- `GET /api/fs/list?parent=<path>` — List filesystem items from PostgreSQL
- `GET /api/fs/read?path=<path>` — Read file content from PostgreSQL
- `POST /api/fs/write` — Create/update file in PostgreSQL
- `DELETE /api/fs/delete?path=<path>` — Delete file from PostgreSQL

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations (no user API key required)
- **Model**: gpt-5-mini for ARIA chat responses
- **Streaming**: SSE — ARIA streams responses token-by-token in real-time
- **Env vars**: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` (auto-set)
- **System prompt**: ARIA has FRAMELESS OS context — threat counts, agent ethics, mesh nodes, investor data

### Database
PostgreSQL with Drizzle ORM. Tables: threats, ai_agents, network_nodes, events, healing_events, platforms, conversations, messages, fs_files (dynamic/create-on-demand).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI SDK (`openai ^4`) via Replit AI Integrations
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Routing Notes

- Replit proxy routes `/api/...` → port 8080, `/` → port 8081
- Frontend uses relative URLs like `/api/threats` (no base URL needed)
- API endpoint for dashboard is `/api/dashboard/summary`
- SSE endpoints: `/api/aria/chat` and `/api/system/events/stream` — use `fetch` with `ReadableStream` on the frontend, NOT generated hooks

## Design System

- **Primary color**: `hsl(185,100%,50%)` — electric cyan
- **Background**: `hsl(220,60%,4%)` — near-black
- **Font**: JetBrains Mono (monospace, terminal aesthetic)
- **Accents**: glow effects with `text-shadow` and `box-shadow`
- **Grid overlay**: subtle 48px grid lines on desktop background

## Important Code Patterns

- **OpenAI chat**: Use `model: "gpt-5-mini"`, `max_completion_tokens: 1024`, no `temperature` param
- **SSE streams**: Set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- **Terminal commands**: `ALLOWED_COMMANDS` set + special FRAMELESS commands that hit the DB
- **Filesystem**: `fs_files` table auto-created and seeded on first `/api/fs/list` request
