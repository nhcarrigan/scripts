import { Octokit } from "@octokit/rest";

import { logHandler } from "../utils/logHandler";

import { TeamRepos } from "./config/TeamRepos";

(async () => {
  const github = new Octokit({
    auth: `Bearer ${process.env.GITHUB_TOKEN}`
  });
  const repos = await github.repos.listForOrg({
    type: "all",
    org: "nhcarrigan",
    limit: 100
  });
  logHandler.debug(`Found ${repos.data.length} repositories.`);
  for (const repo of repos.data) {
    for (const team of TeamRepos) {
      await github.teams
        .addOrUpdateRepoPermissionsInOrg({
          org: "nhcarrigan",
          team_slug: team.team_slug,
          owner: "nhcarrigan",
          repo: repo.name,
          permission: team.permission
        })
        .then(() =>
          logHandler.debug(
            `${team.team_slug} permissions set to ${team.permission} on ${repo.name}`
          )
        )
        .catch(() =>
          logHandler.error(
            `Failed to update perms for ${team.team_slug} on ${repo.name}`
          )
        );
    }
  }
})();
