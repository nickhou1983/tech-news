import * as cheerio from 'cheerio';
import { SourceAdapter, RawNewsItem } from '../types.js';
import { fetchHtml, absoluteUrl, normalizeDate } from './util.js';

/**
 * Anthropic does not publish a reliable RSS feed for its news page, so we scrape
 * the news index. Fail soft if the markup changes.
 */
export const claudeAdapter: SourceAdapter = {
  provider: 'claude',
  async fetch(): Promise<RawNewsItem[]> {
    const base = 'https://www.anthropic.com/news';
    const html = await fetchHtml(base);
    const $ = cheerio.load(html);
    const items: RawNewsItem[] = [];
    const seen = new Set<string>();

    $('a[href^="/news/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href || href === '/news') return;
      const url = absoluteUrl(href, base);
      if (seen.has(url)) return;

      const title = $(el).text().replace(/\s+/g, ' ').trim();
      if (!title || title.length < 6) return;

      seen.add(url);
      items.push({
        provider: 'claude',
        title,
        url,
        summary: null,
        publishedAt: normalizeDate(null),
      });
    });

    return items.slice(0, 30);
  },
};
