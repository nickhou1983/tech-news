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
  publishedAt: string;
  fetchedAt: string;
}

export type SummaryLang = 'zh' | 'en';

export interface Settings {
  backendUrl: string;
  defaultLang: SummaryLang;
  refreshMinutes: number;
  enabledProviders: ProviderId[];
}

export const DEFAULT_SETTINGS: Settings = {
  backendUrl: 'http://localhost:8787',
  defaultLang: 'zh',
  refreshMinutes: 30,
  enabledProviders: ['copilot', 'claude', 'cursor', 'codex'],
};

export const PROVIDER_META: Record<ProviderId, { name: string; color: string }> = {
  copilot: { name: 'GitHub Copilot', color: '#6e40c9' },
  claude: { name: 'Claude', color: '#d97757' },
  cursor: { name: 'Cursor', color: '#111111' },
  codex: { name: 'Codex / OpenAI', color: '#10a37f' },
};
