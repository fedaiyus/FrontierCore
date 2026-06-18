import { Events, type Guild } from "discord.js";
import type { BotEvent } from "../types/Event";
import { ensureGuildConfig } from "../modules/guildConfig";

export const guildCreateEvent: BotEvent<Events.GuildCreate> = {
  name: Events.GuildCreate,
  async execute(guild: Guild) {
    await ensureGuildConfig(guild);
  }
};
