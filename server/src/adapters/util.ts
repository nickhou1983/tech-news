import Parser from 'rss-parser';
import { request } from 'undici';
import { RawNewsItem, ProviderId } from '../types.js';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'tech-news-aggregator/0.1 (+https://github.com/nickhou1983/tech-news)' },
});

export async function fetchRss(
  provider: ProviderId,
  feedUrl: string,
  filter?: (item: { title?: string; link?: string }) => boolean,
  limit = 40,
): Promise<RawNewsItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const items: RawNewsItem[] = [];
  for (const entry of feed.items) {
    if (!entry.link || !entry.title) continue;
    if (filter && !filter(entry)) continue;
    items.push({
      provider,
      title: entry.title.trim(),
      url: entry.link,
      summary: cleanText(entry.contentSnippet ?? entry.content ?? null),
      content: entry.content ?? null,
      publishedAt: normalizeDate(entry.isoDate ?? entry.pubDate),
    });
    if (items.length >= limit) break;
  }
  return items;
}

export async function fetchHtml(url: string): Promise<string> {
  const res = await request(url, {
    headers: {
      'User-Agent': 'tech-news-aggregator/0.1 (+https://github.com/nickhou1983/tech-news)',
    },
  });
  if (res.statusCode >= 300 && res.statusCode < 400) {
    const location = res.headers['location'];
    if (typeof location === 'string') {
      return fetchHtml(absoluteUrl(location, url));
    }
  }
  if (res.statusCode >= 400) {
    throw new Error(`HTTP ${res.statusCode} for ${url}`);
  }
  return res.body.text();
}

export function normalizeDate(value?: string | null): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function cleanText(html?: string | null): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length ? text.slice(0, 600) : null;
}

export function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
