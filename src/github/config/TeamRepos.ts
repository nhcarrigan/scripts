export const TeamRepos: {
  team_slug: string;
  permission: "pull" | "triage" | "push" | "maintain" | "admin";
}[] = [
  {
    team_slug: "automation",
    permission: "maintain"
  },
  {
    team_slug: "consultants",
    permission: "triage"
  },
  {
    team_slug: "moderators",
    permission: "triage"
  },
  {
    team_slug: "staff",
    permission: "maintain"
  }
];
