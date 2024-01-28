import OpenAI from "openai";
import { extract } from '@extractus/article-extractor'
import { stripHtml } from "string-strip-html";

const openai = new OpenAI();

const FRONT_PAGE_ITEMS = 10;
const HACKER_NEWS_URL = 'https://hacker-news.firebaseio.com/v0';
const MAX_WORDS = 1000;

async function fetchTopStories() {
  const response = await fetch(`${HACKER_NEWS_URL}/topstories.json`);
  const data = await response.json();
  return data.slice(0, FRONT_PAGE_ITEMS);
}

async function fetchItem(id) {
  const response = await fetch(`${HACKER_NEWS_URL}/item/${id}.json`);
  return await response.json();
}

async function generateImprovedHeadline(title, content) {
  if(!title || !content || content.length < 1) {
    return 'Error: No title or content';
  }
  // const prompt = `Given the website hacker news headline '${title}' and the following linked article summary, please generate new pithy title that is sarcastic, rude, trolly or clickbaity: ${content}`;
  const prompt = `Given the website hacker news story title '${title}' and the following linked article, please generate a rude, mocking title to replace it: ${content}`;
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    // model: "gpt-3.5-turbo",
    model: "gpt-4",
  });

  // console.log(completion);
  return completion.choices[0].message.content;
}

async function main() {

  let top = await fetchTopStories();

  // Fetch each item in top
  let stories = top.map(async (id, index) => {
    let item = await fetchItem(id);
    if(item.type === 'story' && item.url) {
      // console.log(`Story ${item.title} - ${item.url}`);
      // https://www.npmjs.com/package/@extractus/article-extractor
      let article = await extract(item.url);
      if (article && article.content && article.title) {
        // console.log(`Article length: ${article.content.length}`);
        let stripped = stripHtml(article.content).result;
        let truncated = stripped.substring(0, MAX_WORDS);
        // console.log(`Article length after stripping: ${truncated.length}`);
        // console.log(truncated);
        let headline = await generateImprovedHeadline(item.title, truncated);
        return {
          title: item.title,
          url: item.url,
          improvedTitle: headline,
          position: index
        };
      } else {
        return {
          title: item.title,
          url: item.url,
          improvedTitle: 'No article content :(',
          position: index
        };
      }
    } else {
      return {
        title: item.title,
        url: item.url,
        improvedTitle: 'Not a story',
        position: index
      };
    }
  });

  let results = await Promise.all(stories);
  results.forEach((result) => {
    console.log(`${result.position + 1}. ${result.title} - ${result.url}`);
    console.log(`   ${result.improvedTitle}`);
  });
}

main();
