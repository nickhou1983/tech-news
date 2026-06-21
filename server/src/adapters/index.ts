import { SourceAdapter } from '../types.js';
import { copilotAdapter } from './copilot.js';
import { claudeAdapter } from './claude.js';
import { cursorAdapter } from './cursor.js';
import { codexAdapter } from './codex.js';

export const adapters: SourceAdapter[] = [
  copilotAdapter,
  claudeAdapter,
  cursorAdapter,
  codexAdapter,
];
