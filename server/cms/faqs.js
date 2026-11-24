// FAQs shown on /faq. Edited in the dashboard (FAQs tab); stored as content/faqs.json = { items: [...] }, in display order.
// The page heading and SEO of /faq are edited like any other page, under Pages.
import { readJson, writeJson, uid } from './store.js';

const str = (v, n) => String(v ?? '').replace(/\r/g, '').trim().slice(0, n);

export const getFaqs = () => { const d = readJson('faqs', null); return { items: Array.isArray(d?.items) ? d.items : [] }; };

/** Public site: published questions only, in the saved order. */
export const publicFaqs = () => getFaqs().items.filter((x) => x.published !== false).map(({ id, question, answer, category }) => ({ id, question, answer, category }));

export function saveFaqs(raw) {
  const list = Array.isArray(raw?.items) ? raw.items : null;
  if (!list) throw new Error('Nothing to save.');
  if (list.length > 300) throw new Error('At most 300 questions.');
  const seen = new Set();
  const items = list.map((x, i) => {
    const question = str(x?.question, 300); const answer = str(x?.answer, 6000);
    if (!question) throw new Error(`Question ${i + 1} is empty.`);
    if (!answer) throw new Error(`The question “${question.slice(0, 60)}” has no answer.`);
    let id = /^[a-z0-9]{8,32}$/.test(String(x.id || '')) ? x.id : uid();
    while (seen.has(id)) id = uid();
    seen.add(id);
    return { id, question, answer, category: str(x.category, 60), published: x.published !== false };
  });
  writeJson('faqs', { items });
  return { items };
}
