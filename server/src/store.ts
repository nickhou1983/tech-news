import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { config } from './config.js';
import {
  NewsItem,
  ProviderId,
  RawNewsItem,
  SummaryLang,
  SummaryResult,
} from './types.js';

function stableId(provider: string, url: string): string {
  return createHash('sha1').update(`${provider}::${url}`).digest('hex').slice(0, 16);
}

export class Store {
  private db: Database.Database;

  constructor(path = config.databasePath) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS news_items (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        summary TEXT,
        content TEXT,
        published_at TEXT NOT NULL,
        fetched_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_items_provider ON news_items(provider);
      CREATE INDEX IF NOT EXISTS idx_items_published ON news_items(published_at);

      CREATE TABLE IF NOT EXISTS summaries (
        item_id TEXT NOT NULL,
        lang TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (item_id, lang),
        FOREIGN KEY (item_id) REFERENCES news_items(id) ON DELETE CASCADE
      );
    `);
  }

  /** Insert new items, ignoring duplicates. Returns number of newly inserted rows. */
  upsertItems(raw: RawNewsItem[]): number {
    const now = new Date().toISOString();
    const insert = this.db.prepare(`
      INSERT INTO news_items (id, provider, title, url, summary, content, published_at, fetched_at)
      VALUES (@id, @provider, @title, @url, @summary, @content, @publishedAt, @fetchedAt)
      ON CONFLICT(id) DO NOTHING
    `);
    const tx = this.db.transaction((items: RawNewsItem[]) => {
      let count = 0;
      for (const it of items) {
        const res = insert.run({
          id: stableId(it.provider, it.url),
          provider: it.provider,
          title: it.title,
          url: it.url,
          summary: it.summary ?? null,
          content: it.content ?? null,
          publishedAt: it.publishedAt,
          fetchedAt: now,
        });
        count += res.changes;
      }
      return count;
    });
    return tx(raw);
  }

  listItems(opts: {
    provider?: ProviderId;
    since?: string;
    limit: number;
    offset: number;
  }): { items: NewsItem[]; total: number } {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    if (opts.provider) {
      where.push('provider = @provider');
      params.provider = opts.provider;
    }
    if (opts.since) {
      where.push('published_at >= @since');
      params.since = opts.since;
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const total = (
      this.db.prepare(`SELECT COUNT(*) AS n FROM news_items ${whereSql}`).get(params) as {
        n: number;
      }
    ).n;

    const rows = this.db
      .prepare(
        `SELECT * FROM news_items ${whereSql}
         ORDER BY published_at DESC
         LIMIT @limit OFFSET @offset`,
      )
      .all({ ...params, limit: opts.limit, offset: opts.offset });

    return { items: rows.map(rowToItem), total };
  }

  getItem(id: string): NewsItem | null {
    const row = this.db.prepare('SELECT * FROM news_items WHERE id = ?').get(id);
    return row ? rowToItem(row) : null;
  }

  getSummary(itemId: string, lang: SummaryLang): SummaryResult | null {
    const row = this.db
      .prepare('SELECT * FROM summaries WHERE item_id = ? AND lang = ?')
      .get(itemId, lang) as
      | { item_id: string; lang: SummaryLang; summary: string; created_at: string }
      | undefined;
    if (!row) return null;
    return {
      itemId: row.item_id,
      lang: row.lang,
      summary: row.summary,
      createdAt: row.created_at,
    };
  }

  saveSummary(itemId: string, lang: SummaryLang, summary: string): SummaryResult {
    const createdAt = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO summaries (item_id, lang, summary, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(item_id, lang) DO UPDATE SET summary = excluded.summary, created_at = excluded.created_at`,
      )
      .run(itemId, lang, summary, createdAt);
    return { itemId, lang, summary, createdAt };
  }
}

interface ItemRow {
  id: string;
  provider: ProviderId;
  title: string;
  url: string;
  summary: string | null;
  content: string | null;
  published_at: string;
  fetched_at: string;
}

function rowToItem(row: unknown): NewsItem {
  const r = row as ItemRow;
  return {
    id: r.id,
    provider: r.provider,
    title: r.title,
    url: r.url,
    summary: r.summary,
    content: r.content,
    publishedAt: r.published_at,
    fetchedAt: r.fetched_at,
  };
}
