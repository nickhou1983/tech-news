import { ProviderId, Provider } from './types.js';

export const PROVIDERS: Record<ProviderId, Provider> = {
  copilot: {
    id: 'copilot',
    name: 'GitHub Copilot',
    homepage: 'https://github.blog/changelog/label/copilot/',
  },
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    homepage: 'https://www.anthropic.com/news',
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor',
    homepage: 'https://www.cursor.com/changelog',
  },
  codex: {
    id: 'codex',
    name: 'Codex (OpenAI)',
    homepage: 'https://openai.com/news/',
  },
};

export const PROVIDER_LIST: Provider[] = Object.values(PROVIDERS);
