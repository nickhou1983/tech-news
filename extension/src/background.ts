import { ApiClient } from './api.js';
import { getSettings, getReadIds } from './settings.js';

const ALARM = 'refresh-news';

async function setupAlarm(): Promise<void> {
  const settings = await getSettings();
  await chrome.alarms.clear(ALARM);
  await chrome.alarms.create(ALARM, { periodInMinutes: Math.max(settings.refreshMinutes, 5) });
}

async function poll(): Promise<void> {
  try {
    const settings = await getSettings();
    const api = new ApiClient(settings.backendUrl);
    const { items } = await api.news({ limit: 100 });
    const readIds = await getReadIds();
    const unread = items.filter((i) => !readIds.has(i.id)).length;
    await updateBadge(unread);
  } catch {
    await updateBadge(0);
  }
}

async function updateBadge(unread: number): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: '#6e40c9' });
  await chrome.action.setBadgeText({ text: unread > 0 ? String(Math.min(unread, 999)) : '' });
}

chrome.runtime.onInstalled.addListener(() => {
  void setupAlarm();
  void poll();
});

chrome.runtime.onStartup.addListener(() => {
  void setupAlarm();
  void poll();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) void poll();
});

// Re-arm the alarm when settings change.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) void setupAlarm();
  if (area === 'local' && changes.readIds) void poll();
});

// Let the side panel trigger an immediate badge refresh.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'refresh-badge') void poll();
});

// Open the side panel when the toolbar icon is clicked.
if (chrome.sidePanel?.setPanelBehavior) {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}
