import { type Guild, PermissionFlagsBits } from "discord.js";
import { ensureGuildConfig } from "../modules/guildConfig";

export async function isStaffMember(guild: Guild, userId: string): Promise<boolean> {
  const [config, member] = await Promise.all([
    ensureGuildConfig(guild),
    guild.members.fetch(userId).catch(() => null)
  ]);

  if (!member) {
    return false;
  }

  if (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    return true;
  }

  const staffRoleIds = [config.supportRoleId, config.staffRoleId, config.adminRoleId].filter(Boolean);
  return staffRoleIds.some((roleId) => member.roles.cache.has(roleId as string));
}

export async function isAdminMember(guild: Guild, userId: string): Promise<boolean> {
  const [config, member] = await Promise.all([
    ensureGuildConfig(guild),
    guild.members.fetch(userId).catch(() => null)
  ]);

  if (!member) {
    return false;
  }

  if (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    return true;
  }

  return Boolean(config.adminRoleId && member.roles.cache.has(config.adminRoleId));
}
