import { Events, type GuildMember, type PartialGuildMember } from "discord.js";
import type { BotEvent } from "../types/Event";
import { logMemberLeft } from "../modules/logging";

export const guildMemberRemoveEvent: BotEvent<Events.GuildMemberRemove> = {
  name: Events.GuildMemberRemove,
  async execute(member: GuildMember | PartialGuildMember) {
    if (member.partial) {
      return;
    }

    await logMemberLeft(member);
  }
};
