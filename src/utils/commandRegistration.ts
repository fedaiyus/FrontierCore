import { REST, Routes } from "discord.js";
import { env } from "../config/env";
import { commands } from "../commands";

export async function registerApplicationCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
  const body = commands.map((command) => command.data.toJSON());

  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
}
