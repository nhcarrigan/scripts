import { Octokit } from "@octokit/rest";

import { logHandler } from "../utils/logHandler";

import { Labels } from "./config/Labels";

const checkIfLabelExists = async (
  github: Octokit,
  owner: string,
  repo: string,
  labelName: string
): Promise<boolean> => {
  try {
    const response = await github.issues.getLabel({
      owner,
      repo,
      name: labelName
    });

    return !!response.data;
  } catch (error) {
    if ((error as { status: number }).status === 404) {
      return false;
    } else {
      logHandler.error(error);
      throw false;
    }
  }
};

(async () => {
  const owner = "nhcarrigan";

  // This tool is only really useful for mass closing PRs.
  const github = new Octokit({
    auth: `Bearer ${process.env.GITHUB_TOKEN}`
  });
  /**
   * Switch between these depending on the owner.
   */
  //   const repos = await github.repos.listForUser({ username: owner });
  const repos = await github.repos.listForOrg({ org: owner });
  logHandler.debug(`Found ${repos.data.length} repositories.`);
  for (const repo of repos.data) {
    logHandler.debug(`Syncing ${repo.name}`);
    for (const label of Labels) {
      const exists = await checkIfLabelExists(
        github,
        owner,
        repo.name,
        label.name
      );
      if (exists) {
        await github.issues.updateLabel({
          owner,
          repo: repo.name,
          name: label.name,
          color: label.color,
          description: label.description
        });
        continue;
      }
      await github.issues.createLabel({
        owner,
        repo: repo.name,
        name: label.name,
        color: label.color,
        description: label.description
      });
    }
  }
})();
