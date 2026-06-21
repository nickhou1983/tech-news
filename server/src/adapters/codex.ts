import * as cheerio from 'cheerio';
import { SourceAdapter, RawNewsItem } from '../types.js';
import { fetchHtml, fetchRss, absoluteUrl, normalizeDate } from './util.js';

/**
 * OpenAI / Codex updates. Prefer the OpenAI news RSS feed; fall back to scraping
 * the news index. Items are filtered toward Codex / API / developer topics but we
 * keep general OpenAI news too since Codex ships within the broader platform.
 */
export const codexAdapter: SourceAdapter = {
  provider: 'codex',
  async fetch(): Promise<RawNewsItem[]> {
    try {
      const rss = await fetchRss('codex', 'https://openai.com/news/rss.xml');
      if (rss.length) return rss;
    } catch {
      // fall through to scrape
    }

    const base = 'https://openai.com/news/';
    const html = await fetchHtml(base);
    const $ = cheerio.load(html);
    const items: RawNewsItem[] = [];
    const seen = new Set<string>();

    $('a[href*="/index/"], a[href^="/news/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const url = absoluteUrl(href, base);
      if (seen.has(url)) return;

      const title = $(el).text().replace(/\s+/g, ' ').trim();
      if (!title || title.length < 6) return;

      seen.add(url);
      items.push({
        provider: 'codex',
        title,
        url,
        summary: null,
        publishedAt: normalizeDate(null),
      });
    });

    return items.slice(0, 30);
  },
};
