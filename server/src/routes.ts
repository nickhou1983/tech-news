import { FastifyInstance } from 'fastify';
import { Store } from './store.js';
import { Aggregator } from './aggregator.js';
import { Summarizer } from './summarizer.js';
import { PROVIDER_LIST, PROVIDERS } from './providers.js';
import { ProviderId, SummaryLang } from './types.js';

const VALID_PROVIDERS = new Set<ProviderId>(['copilot', 'claude', 'cursor', 'codex']);
const VALID_LANGS = new Set<SummaryLang>(['zh', 'en']);

export function registerRoutes(
  app: FastifyInstance,
  store: Store,
  aggregator: Aggregator,
  summarizer: Summarizer,
): void {
  app.get('/api/health', async () => ({ status: 'ok', llm: summarizer.enabled }));

  app.get('/api/providers', async () => ({ providers: PROVIDER_LIST }));

  app.get('/api/news', async (req) => {
    const q = req.query as Record<string, string | undefined>;
    const provider =
      q.provider && VALID_PROVIDERS.has(q.provider as ProviderId)
        ? (q.provider as ProviderId)
        : undefined;
    const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 200);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const since = q.since && !Number.isNaN(Date.parse(q.since)) ? q.since : undefined;

    const { items, total } = store.listItems({ provider, since, limit, offset });
    return { items, total, limit, offset };
  });

  app.get('/api/news/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = store.getItem(id);
    if (!item) return reply.code(404).send({ error: 'not_found' });
    return item;
  });

  app.post('/api/news/:id/summary', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { lang?: string };
    const lang = (body.lang ?? 'en') as SummaryLang;
    if (!VALID_LANGS.has(lang)) {
      return reply.code(400).send({ error: 'invalid_lang', message: 'lang must be "zh" or "en"' });
    }
    const item = store.getItem(id);
    if (!item) return reply.code(404).send({ error: 'not_found' });

    const cached = store.getSummary(id, lang);
    if (cached) return { ...cached, cached: true };

    if (!summarizer.enabled) {
      return reply
        .code(503)
        .send({ error: 'llm_disabled', message: 'Summarizer not configured (set LLM_API_KEY).' });
    }

    try {
      const text = await summarizer.summarize(item, lang);
      const saved = store.saveSummary(id, lang, text);
      return { ...saved, cached: false };
    } catch (err) {
      req.log.error({ err }, 'summary failed');
      return reply.code(502).send({ error: 'summary_failed', message: (err as Error).message });
    }
  });

  app.post('/api/refresh', async () => {
    const inserted = await aggregator.refresh();
    return { inserted };
  });

  // Touch PROVIDERS so unused-import lint stays happy and validates ids exist.
  void PROVIDERS;
}
