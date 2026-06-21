import 'dotenv/config';

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  port: int(process.env.PORT, 8787),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  refreshIntervalMinutes: int(process.env.REFRESH_INTERVAL_MINUTES, 30),
  databasePath: process.env.DATABASE_PATH ?? './data/news.sqlite',
  llm: {
    apiKey: process.env.LLM_API_KEY ?? '',
    baseUrl: process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    get enabled(): boolean {
      return Boolean(process.env.LLM_API_KEY);
    },
  },
} as const;
