# tech-news

An Edge (Chromium MV3) browser extension that surfaces the latest updates from major
AI developer tools — **GitHub Copilot, Claude/Anthropic, Cursor, Codex/OpenAI** — in a
persistent **side panel**.

News is collected and cached by a small **Node.js + TypeScript** backend aggregator,
which also generates on-demand, user-selectable **Chinese / English** AI summaries via
an OpenAI-compatible LLM API.

## Structure

```
tech-news/
├── server/      # Fastify + TS aggregator, SQLite store, LLM summarizer, REST API
└── extension/   # Edge MV3 extension: side panel UI, service worker, options page
```

## How it works

```
sources (RSS / HTML) ──▶ adapters ──▶ aggregator ──▶ SQLite
                                                        │
extension side panel ◀── REST API ◀────────────────────┘
        │
        └─▶ POST /summary ──▶ LLM (server-side key) ──▶ cached summary
```

The LLM API key lives **only on the backend** and is never shipped in the extension.

## Prerequisites

- Node.js 20+ and npm 10+
- Microsoft Edge (or any Chromium browser)

## 1. Install

```bash
npm install
```

This bootstraps both workspaces (`server` and `extension`).

## 2. Configure & run the backend

```bash
cd server
cp .env.example .env
# (optional) edit .env to add an LLM key for summaries
npm run dev          # or: npm run build && npm start
```

The server listens on `http://localhost:8787` and refreshes sources on startup and on
a schedule (`REFRESH_INTERVAL_MINUTES`, default 30).

### Environment variables (`server/.env`)

| Variable                   | Default                     | Description                                  |
| -------------------------- | --------------------------- | -------------------------------------------- |
| `PORT`                     | `8787`                      | HTTP port                                    |
| `CORS_ORIGIN`              | `*`                         | Allowed origins (comma-separated, or `*`)    |
| `REFRESH_INTERVAL_MINUTES` | `30`                        | Source refresh interval                      |
| `DATABASE_PATH`            | `./data/news.sqlite`        | SQLite file path                             |
| `LLM_API_KEY`              | _(empty)_                   | OpenAI-compatible key. Empty = summaries off |
| `LLM_BASE_URL`             | `https://api.openai.com/v1` | OpenAI-compatible base URL                   |
| `LLM_MODEL`                | `gpt-4o-mini`               | Model used for summaries                     |

### REST API

| Method | Path                    | Description                                          |
| ------ | ----------------------- | --------------------------------------------------- |
| GET    | `/api/health`           | Health + whether the LLM summarizer is enabled      |
| GET    | `/api/providers`        | Provider metadata for UI filters                    |
| GET    | `/api/news`             | List items (`provider`, `since`, `limit`, `offset`) |
| GET    | `/api/news/:id`         | Single item                                         |
| POST   | `/api/news/:id/summary` | `{ "lang": "zh" \| "en" }` → cached/fresh summary   |
| POST   | `/api/refresh`          | Trigger an immediate source refresh                 |

## 3. Build & load the extension

```bash
cd extension
npm run build        # outputs to extension/dist
```

Then in Edge:

1. Go to `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `extension/dist`.
4. Click the toolbar icon to open the **side panel**.

Open **Settings** (⚙ in the panel, or the extension's options page) to set the backend
URL, default summary language, refresh interval, and which providers to show. Use
**Test connection** to verify the backend is reachable.

> During development you can run `npm run dev` in `extension/` to rebuild on change
> (reload the unpacked extension in Edge to pick up changes).

## Features

- Aggregates official changelogs / release notes / blogs (RSS-first, HTML scrape fallback).
- Persistent Edge side panel: provider filter, search, read/unread state, source links.
- On-demand AI summaries per item, switchable between **中文** and **English**.
- Background polling with an unread-count toolbar badge.
- Configurable backend URL, refresh interval, default language, and enabled providers.

## Notes & limitations

- HTML scraping (Claude, Cursor, OpenAI fallback) is best-effort and may need updates if
  those sites change their markup; each source fails soft so one breakage won't take down
  the feed.
- Scraped sources may not expose precise publish dates; those items use fetch time.
- Summaries require a valid `LLM_API_KEY`; without it the API returns `503 llm_disabled`
  and the panel shows a friendly message.

## License

MIT
