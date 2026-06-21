import { ApiClient } from './api.js';
import { getSettings, getReadIds, setReadIds } from './settings.js';
import { NewsItem, ProviderId, PROVIDER_META, Settings, SummaryLang } from './types.js';

const feedEl = document.getElementById('feed') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const filtersEl = document.getElementById('filters') as HTMLElement;
const searchEl = document.getElementById('search') as HTMLInputElement;
const langEl = document.getElementById('lang') as HTMLSelectElement;
const refreshBtn = document.getElementById('refresh') as HTMLButtonElement;
const optionsBtn = document.getElementById('open-options') as HTMLButtonElement;

let settings: Settings;
let api: ApiClient;
let allItems: NewsItem[] = [];
let readIds: Set<string> = new Set();
let activeProvider: ProviderId | 'all' = 'all';

function setStatus(text: string, isError = false): void {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function renderFilters(): void {
  const providers: (ProviderId | 'all')[] = ['all', 'copilot', 'claude', 'cursor', 'codex'];
  filtersEl.innerHTML = '';
  for (const p of providers) {
    const chip = document.createElement('span');
    chip.className = 'chip' + (activeProvider === p ? ' active' : '');
    chip.textContent = p === 'all' ? 'All' : PROVIDER_META[p].name;
    chip.addEventListener('click', () => {
      activeProvider = p;
      renderFilters();
      renderFeed();
    });
    filtersEl.appendChild(chip);
  }
}

function visibleItems(): NewsItem[] {
  const q = searchEl.value.trim().toLowerCase();
  return allItems.filter((it) => {
    if (activeProvider !== 'all' && it.provider !== activeProvider) return false;
    if (q && !`${it.title} ${it.summary ?? ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

async function markRead(id: string): Promise<void> {
  readIds.add(id);
  await setReadIds(readIds);
  chrome.runtime.sendMessage({ type: 'refresh-badge' });
}

function renderFeed(): void {
  const items = visibleItems();
  feedEl.innerHTML = '';
  if (!items.length) {
    setStatus('No updates match your filters.');
    return;
  }
  setStatus(`${items.length} update${items.length === 1 ? '' : 's'}`);

  for (const it of items) {
    const meta = PROVIDER_META[it.provider];
    const card = document.createElement('article');
    card.className = 'card' + (readIds.has(it.id) ? ' read' : '');

    const top = document.createElement('div');
    top.className = 'card-top';
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.style.background = meta.color;
    badge.textContent = meta.name;
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = timeAgo(it.publishedAt);
    top.append(badge, time);

    const link = document.createElement('a');
    link.className = 'title';
    link.href = it.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = it.title;
    link.addEventListener('click', () => void markRead(it.id));

    card.append(top, link);

    if (it.summary) {
      const desc = document.createElement('p');
      desc.className = 'desc';
      desc.textContent = it.summary.slice(0, 200);
      card.appendChild(desc);
    }

    const summaryBox = document.createElement('div');
    summaryBox.className = 'summary';
    summaryBox.style.display = 'none';
    card.appendChild(summaryBox);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const sumBtn = document.createElement('button');
    sumBtn.textContent = '✨ Summarize';
    sumBtn.addEventListener('click', () =>
      void summarize(it.id, langEl.value as SummaryLang, summaryBox, sumBtn),
    );

    const readBtn = document.createElement('button');
    readBtn.textContent = readIds.has(it.id) ? '✓ Read' : 'Mark read';
    readBtn.addEventListener('click', async () => {
      await markRead(it.id);
      card.classList.add('read');
      readBtn.textContent = '✓ Read';
    });

    actions.append(sumBtn, readBtn);
    card.appendChild(actions);
    feedEl.appendChild(card);
  }
}

async function summarize(
  id: string,
  lang: SummaryLang,
  box: HTMLElement,
  btn: HTMLButtonElement,
): Promise<void> {
  box.style.display = 'block';
  box.textContent = lang === 'zh' ? '生成摘要中…' : 'Generating summary…';
  btn.disabled = true;
  try {
    const res = await api.summary(id, lang);
    box.textContent = res.summary;
  } catch (err) {
    box.textContent =
      (lang === 'zh' ? '摘要失败：' : 'Summary failed: ') + (err as Error).message;
  } finally {
    btn.disabled = false;
  }
}

async function load(): Promise<void> {
  setStatus('Loading…');
  try {
    const { items } = await api.news({ limit: 150 });
    allItems = items.filter((i) => settings.enabledProviders.includes(i.provider));
    renderFeed();
  } catch (err) {
    setStatus(
      `Cannot reach backend at ${settings.backendUrl}. Check it's running and the URL in Settings. (${(err as Error).message})`,
      true,
    );
  }
}

async function init(): Promise<void> {
  settings = await getSettings();
  api = new ApiClient(settings.backendUrl);
  readIds = await getReadIds();
  langEl.value = settings.defaultLang;

  renderFilters();
  searchEl.addEventListener('input', renderFeed);
  refreshBtn.addEventListener('click', () => void load());
  optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

  await load();
}

void init();
