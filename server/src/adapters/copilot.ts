import { SourceAdapter, RawNewsItem } from '../types.js';
import { fetchRss } from './util.js';

/**
 * GitHub Copilot updates come from the GitHub Changelog RSS feed, filtered to
 * Copilot-related entries.
 */
export const copilotAdapter: SourceAdapter = {
  provider: 'copilot',
  async fetch(): Promise<RawNewsItem[]> {
    const feedUrl = 'https://github.blog/changelog/label/copilot/feed/';
    try {
      return await fetchRss('copilot', feedUrl);
    } catch {
      // Fallback: full changelog feed filtered by keyword.
      return fetchRss('copilot', 'https://github.blog/changelog/feed/', (entry) =>
        /copilot/i.test(`${entry.title ?? ''} ${entry.link ?? ''}`),
      );
    }
  },
};
