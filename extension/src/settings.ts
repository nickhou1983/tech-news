import { DEFAULT_SETTINGS, Settings } from './types.js';

const SETTINGS_KEY = 'settings';
const READ_KEY = 'readIds';

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(data[SETTINGS_KEY] as Partial<Settings> | undefined) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}

export async function getReadIds(): Promise<Set<string>> {
  const data = await chrome.storage.local.get(READ_KEY);
  return new Set<string>((data[READ_KEY] as string[] | undefined) ?? []);
}

export async function setReadIds(ids: Set<string>): Promise<void> {
  await chrome.storage.local.set({ [READ_KEY]: [...ids] });
}
