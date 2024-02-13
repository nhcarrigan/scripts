import { appendFile, readFile, writeFile } from "fs/promises";
import { join } from "path";

import { logHandler } from "../utils/logHandler";
import { sleep } from "../utils/sleep";

import { DiscourseCategory } from "./interfaces/DiscourseCategory";
import { DiscoursePost } from "./interfaces/DiscoursePost";
import { DiscourseTopic } from "./interfaces/DiscourseTopic";
import { DiscourseTopics } from "./interfaces/DiscourseTopics";

const KEY = process.env.DISCOURSE_API_KEY ?? "unknown";
const USER = process.env.DISCOURSE_USER_NAME ?? "unknown";
const BASE_URL = process.env.DISCOURSE_BASE_URL;

/**
 * Gets categories, finds the guide category.
 *
 * @param {string} slug The slug of the category to fetch.
 * @returns {DiscourseCategory["category_list"]["categories"][number]} The found category.
 */
const getCategory = async (
  slug: string
): Promise<
  DiscourseCategory["category_list"]["categories"][number] | undefined
> => {
  const req = await fetch(`${BASE_URL}/categories.json`);
  const res = (await req.json()) as DiscourseCategory;
  const category = res.category_list.categories.find((c) => c.slug === slug);
  return category;
};

/**
 * Grabs all topics from the category, writes to file.
 *
 * @param {DiscourseCategory["category_list"]["categories"][number]} category The category to look for posts in.
 * @returns {DiscourseCategory["category_list"]["categories"][number]} The found category.
 */
const getTopics = async (
  category: DiscourseCategory["category_list"]["categories"][number]
) => {
  const topics: DiscourseTopics["topic_list"]["topics"] = [];
  const req = await fetch(
    `https://forum.freecodecamp.org/c/${category.slug}/${category.id}.json?page=0`,
    {
      headers: {
        "Api-Key": KEY,
        "Api-Username": USER
      }
    }
  );
  let res = (await req.json()) as DiscourseTopics;
  let page = 0;
  logHandler.debug("Page 1: " + res.topic_list.topics.length);
  topics.push(...res.topic_list.topics);
  logHandler.debug(`Loaded ${topics.length} topics...`);
  logHandler.debug(`Ending with ${topics.at(-1)?.id}`);
  while (res.topic_list.topics.length >= 50) {
    page++;
    const req = await fetch(
      `https://forum.freecodecamp.org/c/guide/497.json?page=${page}`,
      {
        headers: {
          "Api-Key": KEY,
          "Api-Username": "nhcarrigan"
        }
      }
    );
    res = (await req.json()) as DiscourseTopics;
    logHandler.debug(`Page ${page}: ` + res.topic_list.topics.length);
    topics.push(...res.topic_list.topics);
    logHandler.debug(`Ending with ${topics.at(-1)?.id}`);
  }
  logHandler.debug(`All done~! Loaded ${topics.length} topics.`);
  await writeFile(
    join(process.cwd(), "topics.json"),
    JSON.stringify(topics, null, 2),
    "utf-8"
  );
};

/**
 * Filters topics based on a regex match of the topic title.
 *
 * @param {string} regex The regular expression string to match.
 */
const filterTopics = async (regex: RegExp) => {
  const data = await readFile(join(process.cwd(), "topics.json"), "utf-8");
  const json = JSON.parse(data) as DiscourseTopics["topic_list"]["topics"];
  const topics = json.filter((t) => t.title.match(regex));
  await writeFile(
    join(process.cwd(), "filtered.json"),
    JSON.stringify(topics, null, 2),
    "utf-8"
  );
  logHandler.debug(`Found ${topics.length} topics.`);
};

/**
 * Removes the solutions >:3 .
 *
 * Feel free to update the split query and the replacement text to suit your needs.
 */
const removeSolutions = async () => {
  const data = await readFile(join(process.cwd(), "filtered.json"), "utf-8");
  const json = JSON.parse(data) as DiscourseTopics["topic_list"]["topics"];
  for (const topic of json) {
    logHandler.debug(`Running ${topic.id}...`);
    const req = await fetch(
      `https://forum.freecodecamp.org/t/${topic.id}.json`,
      {
        headers: {
          "Api-Key": KEY,
          "Api-Username": "nhcarrigan"
        }
      }
    );
    const res = (await req.json()) as DiscourseTopic;
    if (!res.post_stream?.posts?.[0]) {
      logHandler.error(
        `Cannot find posts for ${topic.id}. Manually investigate.`
      );
      await appendFile(
        join(process.cwd(), "errors.txt"),
        `Cannot find posts for ${topic.id}. Manually investigate.\nhttps://forum.freecodecamp.org/${topic.slug}\n`,
        "utf-8"
      );
      await sleep(2000);
      continue;
    }
    const id = res.post_stream.posts[0].id;
    const [body, target] =
      res.post_stream.posts[0].cooked.split("Solutions</h2>\n");
    if (!target || !target.endsWith("</details>")) {
      if (body?.includes("This is a stub")) {
        logHandler.debug(`${topic.id} is a stub.`);
        await sleep(2000);
        continue;
      }
      logHandler.debug(
        `Invalid split for ${topic.id}. Please manually investigate.\n${topic.slug}`
      );
      await appendFile(
        join(process.cwd(), "errors.txt"),
        `Invalid split for ${topic.id}. Please manually investigate.\nhttps://forum.freecodecamp.org/${topic.slug}\n`,
        "utf-8"
      );
      await sleep(2000);
      continue;
    }
    const fixed = [
      body,
      "Solutions are not provided for Project Euler challenges."
    ].join("Solutions</h2>\n");
    const payload = { post: { raw: fixed } };
    const reqTwo = await fetch(
      `https://forum.freecodecamp.org/posts/${id}.json`,
      {
        headers: {
          "Api-Key": KEY,
          "Api-Username": "nhcarrigan",
          "content-type": "application/json"
        },
        method: "PUT",
        body: JSON.stringify(payload)
      }
    );
    const resTwo = (await reqTwo.json()) as
      | DiscoursePost
      | { errors: unknown[] };
    if ("errors" in resTwo) {
      logHandler.error(resTwo);
      continue;
    }
    logHandler.debug(`Updated ${topic.id}`);
    // This ensures we obey rate limits.
    await sleep(2000);
  }
};

(async () => {
  // Change this to match the category you want to query.
  const slug = "guide";
  // Change this to filter the titles you'd like to update.
  const regex = /problem\s\d+:?/i;

  const category = await getCategory(slug);
  if (!category) {
    throw new Error(
      `Could not find a category at ${BASE_URL}/categories.json with the slug ${slug}`
    );
  }
  await getTopics(category);
  await filterTopics(regex);
  await removeSolutions();
})();
