# tech-news

An Edge (Chromium MV3) browser extension that surfaces the latest updates from major
AI developer tools — **GitHub Copilot, Claude/Anthropic, Cursor, Codex/OpenAI** and more —
in a persistent **side panel**.

News is collected and cached by a small **Node.js + TypeScript** backend aggregator,
which also generates user-selectable **Chinese / English** AI summaries via an LLM API.

## Structure

```
tech-news/
├── server/      # Node + TS + Fastify aggregator + LLM summarizer
└── extension/   # Edge MV3 extension (side panel UI + service worker)
```

## Status

🚧 Early scaffolding. See the project plan for the full roadmap.

## Features (planned)

- Aggregates official changelogs / release notes / blogs (RSS-first, scrape fallback).
- Persistent Edge side panel feed with provider filter, search, and read state.
- On-demand AI summaries per item, switchable between Chinese and English.
- Background polling with unread badge and optional notifications.
- Configurable backend URL, refresh interval, and enabled providers.

## License

MIT
