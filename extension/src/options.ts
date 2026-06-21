import { ApiClient } from './api.js';
import { getSettings, saveSettings } from './settings.js';
import { ProviderId, Settings } from './types.js';

const backendUrl = document.getElementById('backendUrl') as HTMLInputElement;
const defaultLang = document.getElementById('defaultLang') as HTMLSelectElement;
const refreshMinutes = document.getElementById('refreshMinutes') as HTMLInputElement;
const provBoxes = Array.from(document.querySelectorAll<HTMLInputElement>('.prov'));
const saveBtn = document.getElementById('save') as HTMLButtonElement;
const testBtn = document.getElementById('test') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLElement;

function readForm(): Settings {
  const enabledProviders = provBoxes
    .filter((b) => b.checked)
    .map((b) => b.value as ProviderId);
  return {
    backendUrl: backendUrl.value.trim() || 'http://localhost:8787',
    defaultLang: defaultLang.value === 'en' ? 'en' : 'zh',
    refreshMinutes: Math.max(5, Number(refreshMinutes.value) || 30),
    enabledProviders: enabledProviders.length ? enabledProviders : ['copilot', 'claude', 'cursor', 'codex'],
  };
}

async function fill(): Promise<void> {
  const s = await getSettings();
  backendUrl.value = s.backendUrl;
  defaultLang.value = s.defaultLang;
  refreshMinutes.value = String(s.refreshMinutes);
  for (const b of provBoxes) b.checked = s.enabledProviders.includes(b.value as ProviderId);
}

saveBtn.addEventListener('click', async () => {
  await saveSettings(readForm());
  statusEl.textContent = 'Saved ✓';
  setTimeout(() => (statusEl.textContent = ''), 2000);
});

testBtn.addEventListener('click', async () => {
  statusEl.textContent = 'Testing…';
  try {
    const api = new ApiClient(backendUrl.value.trim() || 'http://localhost:8787');
    const h = await api.health();
    statusEl.textContent = `OK — backend reachable. LLM ${h.llm ? 'enabled' : 'disabled'}.`;
  } catch (err) {
    statusEl.textContent = `Failed: ${(err as Error).message}`;
  }
});

void fill();
