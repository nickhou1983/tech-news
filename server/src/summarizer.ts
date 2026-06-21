import { request } from 'undici';
import { config } from './config.js';
import { NewsItem, SummaryLang } from './types.js';

const PROMPTS: Record<SummaryLang, { system: string; user: (i: NewsItem) => string }> = {
  zh: {
    system:
      '你是一名科技新闻编辑。请用简体中文为给定的 AI 开发工具更新撰写一段简洁、客观的摘要（2-3 句话），突出关键变化和对开发者的意义。只输出摘要正文。',
    user: (i) =>
      `标题：${i.title}\n来源链接：${i.url}\n现有描述：${i.summary ?? '（无）'}\n\n请用中文总结。`,
  },
  en: {
    system:
      'You are a tech news editor. Write a concise, objective 2-3 sentence summary of the given AI dev-tool update, highlighting the key change and why it matters to developers. Output only the summary text.',
    user: (i) =>
      `Title: ${i.title}\nLink: ${i.url}\nExisting description: ${i.summary ?? '(none)'}\n\nSummarize in English.`,
  },
};

export class Summarizer {
  get enabled(): boolean {
    return config.llm.enabled;
  }

  async summarize(item: NewsItem, lang: SummaryLang): Promise<string> {
    if (!this.enabled) {
      throw new Error('LLM summarizer is not configured (set LLM_API_KEY).');
    }
    const prompt = PROMPTS[lang];
    const res = await request(`${config.llm.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: config.llm.model,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user(item) },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (res.statusCode >= 400) {
      const text = await res.body.text();
      throw new Error(`LLM request failed: HTTP ${res.statusCode} ${text.slice(0, 200)}`);
    }

    const data = (await res.body.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('LLM returned an empty response.');
    return content;
  }
}
