import { Events, type Client } from "discord.js";
import type { BotEvent } from "../types/Event";
import { registerApplicationCommands } from "../utils/commandRegistration";
import { ensureGuildConfig } from "../modules/guildConfig";
import { startPresenceRotation } from "../modules/presence";

export const readyEvent: BotEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>) {
    await Promise.all(client.guilds.cache.map((guild) => ensureGuildConfig(guild)));
    await registerApplicationCommands();
    startPresenceRotation(client);
    console.log(`Frontier Core is online as ${client.user.tag}.`);
  }
};
