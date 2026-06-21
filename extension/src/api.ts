import { NewsItem, Provider, SummaryLang } from './types.js';

export class ApiClient {
  constructor(private baseUrl: string) {}

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`;
  }

  async health(): Promise<{ status: string; llm: boolean }> {
    const res = await fetch(this.url('/api/health'));
    if (!res.ok) throw new Error(`health ${res.status}`);
    return res.json();
  }

  async providers(): Promise<Provider[]> {
    const res = await fetch(this.url('/api/providers'));
    if (!res.ok) throw new Error(`providers ${res.status}`);
    const data = (await res.json()) as { providers: Provider[] };
    return data.providers;
  }

  async news(params: { provider?: string; limit?: number; offset?: number } = {}): Promise<{
    items: NewsItem[];
    total: number;
  }> {
    const qs = new URLSearchParams();
    if (params.provider) qs.set('provider', params.provider);
    qs.set('limit', String(params.limit ?? 100));
    qs.set('offset', String(params.offset ?? 0));
    const res = await fetch(this.url(`/api/news?${qs.toString()}`));
    if (!res.ok) throw new Error(`news ${res.status}`);
    return res.json();
  }

  async summary(id: string, lang: SummaryLang): Promise<{ summary: string; cached: boolean }> {
    const res = await fetch(this.url(`/api/news/${id}/summary`), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error((data as { message?: string }).message ?? `summary ${res.status}`);
    }
    return data as { summary: string; cached: boolean };
  }
}
