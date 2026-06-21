import { FastifyBaseLogger } from 'fastify';
import { adapters } from './adapters/index.js';
import { Store } from './store.js';
import { config } from './config.js';

export class Aggregator {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private store: Store,
    private log: FastifyBaseLogger,
  ) {}

  /** Run all adapters once. Each source fails soft. Returns inserted count. */
  async refresh(): Promise<number> {
    let inserted = 0;
    const results = await Promise.allSettled(
      adapters.map(async (a) => {
        const items = await a.fetch();
        const n = this.store.upsertItems(items);
        this.log.info({ provider: a.provider, fetched: items.length, inserted: n }, 'source refreshed');
        return n;
      }),
    );
    for (const r of results) {
      if (r.status === 'fulfilled') inserted += r.value;
      else this.log.warn({ err: r.reason }, 'source refresh failed');
    }
    this.log.info({ inserted }, 'aggregation complete');
    return inserted;
  }

  start(): void {
    const intervalMs = config.refreshIntervalMinutes * 60 * 1000;
    void this.refresh();
    this.timer = setInterval(() => {
      void this.refresh();
    }, intervalMs);
    this.log.info({ minutes: config.refreshIntervalMinutes }, 'scheduler started');
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
