import { writeFile } from "fs/promises";
import { join } from "path";

import { logHandler } from "../utils/logHandler";
import { sleep } from "../utils/sleep";

import { CrowdinStringsResponse } from "./interfaces/CrowdinStringsResponse";

const token = process.env.CROWDIN_API_KEY ?? "NO TOKEN FOUND";
const url = process.env.CROWDIN_BASE_URL ?? "NO URL FOUND";
const projectId = process.env.PROJECT_ID ?? "1";

const langs = [
  // "ro",
  // "fr",
  // "af",
  "ar",
  // "bg",
  // "ca",
  // "cs",
  // "da",
  "de",
  // "el",
  // "fi",
  // "he",
  // "hu",
  "it",
  "ja",
  "ko",
  // "nl",
  // "no",
  // "pl",
  // "pt",
  // "ru",
  // "sr-Cyrl",
  // "sv",
  // "tr",
  "uk",
  "zh-CN",
  // "zu",
  // "ur",
  // "vi",
  "pt-BR",
  // "id",
  // "fa",
  // "ta",
  // "bn",
  // "th",
  // "kk",
  // "az",
  // "dv",
  // "hi",
  // "te",
  // "tl",
  // "si",
  // "uz",
  // "kn",
  "sw",
  // "or",
  // "bn-IN",
  // "am",
  // "ne",
  // "ha",
  "es-EM"
  // "ig",
  // "yo",
  // "om",
  // "ht",
  // "sn",
  // "ti"
];

/**
 * Generates a Crowdin request to apply translations from
 * translation memory when there is a 100% match.
 */
const preTranslate = async () => {
  const files = (await import("./files.json")).default;
  logHandler.info("Triggering pre-translation request.");
  const t = await fetch(
    `${url}/api/v2/projects/${projectId}/pre-translations`,
    {
      headers: {
        authorization: token as string,
        "content-type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        languageIds: langs,
        fileIds: files.map((f) => f.data.id),
        method: "tm",
        autoApproveOption: "perfectMatchOnly",
        translateWithPerfectMatchOnly: true,
        translateUntranslatedOnly: true
      })
    }
  );
  const tr = await t.json();
  logHandler.debug(JSON.stringify(tr, null, 2));
};

/**
 * Checks the status of a pre-translation request.
 *
 * @param {string} id The pre-translation ID, printed to the console in the
 * `preTranslate` function.
 */
const getTranslationStatus = async (id: string) => {
  const res = await fetch(
    `${url}/api/v2/projects/${projectId}/pre-translations/${id}`,
    {
      headers: {
        authorization: token
      }
    }
  );
  const data = (await res.json()).data;
  delete data.attributes.languageIds;
  delete data.attributes.fileIds;
  logHandler.debug(JSON.stringify(data, null, 2));
};

/**
 * Fetches the strings from a file, checks the hidden ones for any
 * stray translations, deletes them.
 *
 * @param {string} id The file ID to check. Get this from the `files.json`.
 */
const removeHiddenTranslations = async (id: number) => {
  const strings = [];
  logHandler.debug("Loading strings page 1...");
  let req = await fetch(
    `${url}/api/v2/projects/${projectId}/strings?fileId=${id}&limit=100`,
    {
      headers: {
        authorization: token
      }
    }
  );
  let res = await req.json();
  strings.push(...res.data);
  let page = 0;
  while (res.data.length >= 100) {
    page += 100;
    logHandler.debug(`Loading strings page ${page / 100}`);
    req = await fetch(
      `${url}/api/v2/projects/${projectId}/strings?fileId=${id}&limit=100&offset=${page}`,
      {
        headers: {
          authorization: token
        }
      }
    );
    res = await req.json();
    strings.push(...res.data);
  }
  const hidden = strings.filter((s) => s.data.isHidden);
  logHandler.info(`Found ${hidden.length} strings.`);
  for (const string of hidden) {
    const id = string.data.id;
    await fetch(`${url}/api/v2/projects/${projectId}/strings/${string.id}`, {
      headers: {
        authorization: token,
        "content-type": "application/json"
      },
      method: "PATCH",
      body: JSON.stringify([
        {
          op: "replace",
          path: "/isHidden",
          value: true
        }
      ])
    });
    logHandler.debug(`Processing ${id}...`);
    await Promise.all(
      langs.map(async (lang) => {
        logHandler.debug(`Checking ${lang}...`);
        const isTransRes = await fetch(
          `${url}/api/v2/projects/${projectId}/languages/${lang}/translations?stringIds=${id}`,
          {
            headers: {
              authorization: token
            }
          }
        );
        const isTrans = await isTransRes.json();
        if (isTrans.data.length) {
          logHandler.warn(`Found ${lang} translations for ${string.data.text}`);
          await fetch(`${url}/projects/${projectId}/translations`, {
            method: "DELETE",
            headers: {
              authorization: token
            },
            body: JSON.stringify({
              stringId: id,
              languageId: lang
            })
          });
        }
        await fetch(
          `${url}/api/v2/projects/${projectId}/strings/${string.id}`,
          {
            headers: {
              authorization: token,
              "content-type": "application/json"
            },
            method: "PATCH",
            body: JSON.stringify([
              {
                op: "replace",
                path: "/isHidden",
                value: true
              }
            ])
          }
        );
        logHandler.info(`${lang} complete.`);
      })
    );
  }
};

/**
 * Gets data on a Crowdin project.
 */
const getProjectData = async () => {
  const res = await fetch(`${url}/api/v2/projects/${projectId}`, {
    headers: {
      authorization: token
    }
  });
  const langs = await res.json();
  await writeFile(
    join(process.cwd(), "project.json"),
    JSON.stringify(langs, null, 2),
    "utf-8"
  );
};

/**
 * Generates a list of all files for the project. Due to size, writes the list
 * to `./files.json`.
 */
const getFileList = async () => {
  const files = [];
  let offset = 0;
  logHandler.debug(`Fetching with offset ${offset}...`);
  let raw = await fetch(
    `${url}/api/v2/projects/${projectId}/files?limit=100&offset=${offset}`,
    {
      headers: {
        authorization: token
      }
    }
  );
  let res = await raw.json();
  files.push(...res.data);
  while (res.data.length === 100) {
    offset += 100;
    logHandler.debug(`Fetching with offset ${offset}...`);
    raw = await fetch(
      `${url}/api/v2/projects/${projectId}/files?limit=100&offset=${offset}`,
      {
        headers: {
          authorization: token
        }
      }
    );
    res = await raw.json();
    files.push(...res.data);
  }
  logHandler.debug(`Loaded ${files.length} files.`);
  // const filtered = files.filter(d => d.data.type !== "fm_md" && d.data.type !== "yaml");
  // console.log(`Found ${filtered.length} files with the wrong type. Writing JSON.`);
  await writeFile(
    join(process.cwd(), "files.json"),
    JSON.stringify(files, null, 2),
    "utf-8"
  );
};

/**
 * Deletes all files from the files.json list.
 *
 * WARNING: THIS IS A HIGHLY DESTRUCTIVE ACTION. DO NOT RUN THIS LIGHTLY.
 */
const deleteFiles = async () => {
  const files = (await import("./files.json")).default;
  logHandler.error(
    `Proceeding to delete ${files.length} files from Crowdin!!!!`
  );
  logHandler.error("Pausing for two minutes.");
  logHandler.error(
    "IF THIS IS NOT WHAT YOU WANT TO DO, PLEASE KILL THE PROCESS IMMEDIATELY."
  );
  await sleep(1000 * 60 * 2);
  let count = 1;
  const total = files.length;
  for (const file of files) {
    logHandler.warn(`Deleting file ${count}/${total}`);
    const id = file.data.id;
    await fetch(`${url}/api/v2/projects/${projectId}/files/${id}`, {
      headers: {
        authorization: token
      },
      method: "DELETE"
    });
    count++;
  }
};

/**
 * Fetches all strings from a file, then searches the result for a specific one.
 *
 * @param {number} id The FILE ID to query.
 */
const getSpecificString = async (id: number) => {
  const res = await fetch(
    `${url}/api/v2/projects/${projectId}/strings?fileId=${id}&limit=100`,
    {
      headers: {
        authorization: token
      }
    }
  );
  const strings = (await res.json()) as CrowdinStringsResponse;
  /**
   * Edit this find query to specify which string you want.
   *
   * @example `s.data.text.startsWith("Now you need to")
   */
  const target = strings.data.find((s) => s.data.id === 1581452);
  logHandler.info(target);
};

/**
 * Use this to hide or unhide a string. Mainly used for testing.
 *
 * @param {number} id The ID of the string to hide/unhide.
 */
const toggleHiddenStatus = async (id: number) => {
  const req = await fetch(`${url}/api/v2/projects/${projectId}/strings/${id}`, {
    headers: {
      authorization: token,
      "content-type": "application/json"
    },
    method: "PATCH",
    body: JSON.stringify([
      {
        op: "replace",
        path: "/isHidden",
        /**
         * This value is the one to change
         * true = hidden
         * false = not hidden
         * Other values result in error.
         */
        value: true
      }
    ])
  });
  const res = await req.text();
  logHandler.debug(res);
};

/**
 * Comment out any scripts that you don't want to run.
 */
(async () => {
  /**
   * These should be fine to run in order.
   * However, you'll want to rerun `getTranslationStatus`
   * on its own periodically, until the pretranslation is complete.
   */
  await getProjectData();
  await getFileList();
  await preTranslate();
  await getTranslationStatus("id from pretranslate here");

  /**
   * This one should be run in isolation.
   */
  await removeHiddenTranslations(0);

  /**
   * These ones are really just here for testing/debugging.
   */
  await getSpecificString(1);
  await toggleHiddenStatus(1);

  /**
   * YOU DEFINITELY WANT TO COMMENT THIS OUT!!!!
   * Is only here to please the linter :3 .
   */
  await deleteFiles();
})();
