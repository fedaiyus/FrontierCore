import { Events, type GuildMember } from "discord.js";
import type { BotEvent } from "../types/Event";
import { logMemberJoined } from "../modules/logging";

export const guildMemberAddEvent: BotEvent<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    await logMemberJoined(member);
  }
};
