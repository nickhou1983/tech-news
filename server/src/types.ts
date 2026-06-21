export type ProviderId = 'copilot' | 'claude' | 'cursor' | 'codex';

export interface Provider {
  id: ProviderId;
  name: string;
  homepage: string;
}

export interface NewsItem {
  id: string;
  provider: ProviderId;
  title: string;
  url: string;
  summary: string | null;
  content: string | null;
  publishedAt: string; // ISO 8601
  fetchedAt: string; // ISO 8601
}

export type SummaryLang = 'zh' | 'en';

export interface SummaryResult {
  itemId: string;
  lang: SummaryLang;
  summary: string;
  createdAt: string;
}

/** A raw item produced by a source adapter before persistence. */
export interface RawNewsItem {
  provider: ProviderId;
  title: string;
  url: string;
  summary?: string | null;
  content?: string | null;
  publishedAt: string;
}

export interface SourceAdapter {
  provider: ProviderId;
  fetch(): Promise<RawNewsItem[]>;
}
