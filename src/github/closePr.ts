import { Octokit } from "@octokit/rest";

(async () => {
  // CHANGE THESE VALUES
  const owner = "nhcarrigan";
  const repo = "scripts";
  const number = 1;
  const body =
    "Thank you for your interest in contributing. We are not accepting these changes at this time.";

  // This tool is only really useful for mass closing PRs.
  // HIGHLY recommended that you use an automation account.
  const github = new Octokit({
    auth: `Bearer ${process.env.GITHUB_TOKEN}`
  });

  await github.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body
  });

  await github.pulls.update({
    owner,
    repo,
    pull_number: number,
    state: "closed"
  });
})();
