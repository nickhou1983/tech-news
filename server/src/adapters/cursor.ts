import * as cheerio from 'cheerio';
import { SourceAdapter, RawNewsItem } from '../types.js';
import { fetchHtml, absoluteUrl, normalizeDate } from './util.js';

/**
 * Cursor publishes a changelog page. Try its RSS-less HTML and extract entries.
 */
export const cursorAdapter: SourceAdapter = {
  provider: 'cursor',
  async fetch(): Promise<RawNewsItem[]> {
    const base = 'https://www.cursor.com/changelog';
    const html = await fetchHtml(base);
    const $ = cheerio.load(html);
    const items: RawNewsItem[] = [];
    const seen = new Set<string>();

    $('a[href^="/changelog/"], a[href*="cursor.com/changelog/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const url = absoluteUrl(href, base);
      if (url.replace(/\/$/, '') === base || seen.has(url)) return;

      const title = $(el).text().replace(/\s+/g, ' ').trim();
      if (!title || title.length < 4) return;

      seen.add(url);
      items.push({
        provider: 'cursor',
        title,
        url,
        summary: null,
        publishedAt: normalizeDate(null),
      });
    });

    return items.slice(0, 30);
  },
};
