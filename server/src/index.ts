import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { Store } from './store.js';
import { Aggregator } from './aggregator.js';
import { Summarizer } from './summarizer.js';
import { registerRoutes } from './routes.js';

async function main(): Promise<void> {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
  });

  const store = new Store();
  const summarizer = new Summarizer();
  const aggregator = new Aggregator(store, app.log);

  registerRoutes(app, store, aggregator, summarizer);

  aggregator.start();

  const shutdown = async (): Promise<void> => {
    aggregator.stop();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
