import OpenAI from "openai";
import { extract } from '@extractus/article-extractor'
import { stripHtml } from "string-strip-html";

const openai = new OpenAI();

const FRONT_PAGE_ITEMS = 1;
const HACKER_NEWS_URL = 'https://hacker-news.firebaseio.com/v0';
const MAX_WORDS = 500;

async function fetchTopStories() {
  const response = await fetch(`${HACKER_NEWS_URL}/topstories.json`);
  const data = await response.json();
  return data.slice(0, FRONT_PAGE_ITEMS);
}

async function fetchItem(id) {
  const response = await fetch(`${HACKER_NEWS_URL}/item/${id}.json`);
  return await response.json();
}

async function main() {

  let top = await fetchTopStories();

  // Fetch each item in top
  top.forEach(async (id) => {
    let item = await fetchItem(id);
    if(item.type === 'story' && item.url) {
      console.log(`Story ${item.title} - ${item.url}`);
      // https://www.npmjs.com/package/@extractus/article-extractor
      let article = await extract(item.url);
      if (article && article.content) {
        console.log(`Article length: ${article.content.length}`);
        let stripped = stripHtml(article.content).result;
        let truncated = stripped.substring(0, MAX_WORDS);
        console.log(`Article length after stripping: ${truncated.length}`);
        console.log(truncated);
      } else {
        console.log(`No article content`);
      }
    } else {
      console.log(`Skipping ${item.type}`);
    }
  });

  return; 
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}

main();
