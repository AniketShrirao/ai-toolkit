import fetch from 'node-fetch';
import { load } from 'cheerio';

export async function extractFromURL(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = load(html);

  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return {
    type: 'url',
    content: text.slice(0, 10000)  // limit to avoid huge content
  };
}
