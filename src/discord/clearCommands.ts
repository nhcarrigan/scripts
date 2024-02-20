import { REST, Routes } from "discord.js";

(async () => {
  const token = process.env.DISCORD_TOKEN;
  const id = process.env.DISCORD_BOT_ID;
  const guild = process.env.DISCORD_GUILD_ID;
  if (!token || !id || !guild) {
    throw new Error("Missing necessary environment variables.");
  }

  const client = new REST({ version: "10" }).setToken(token);
  await client.put(Routes.applicationGuildCommands(id, guild), { body: [] });
  await client.put(Routes.applicationCommands(id), { body: [] });
})();
