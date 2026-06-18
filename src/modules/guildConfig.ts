import { ChannelType, type Guild } from "discord.js";
import type { GuildConfig } from "@prisma/client";
import { detectGuildDefaults } from "../config/hqHierarchy";
import { prisma } from "../database/prisma";
import { defaultLanguageFromGuildName, type Language } from "../i18n";
import { looksTurkish } from "../utils/language";

function defaultTimezoneFromGuildName(name: string): string {
  return looksTurkish(name) ? "Europe/Istanbul" : "UTC";
}

export async function ensureGuildConfig(guild: Guild): Promise<GuildConfig> {
  const existing = await prisma.guildConfig.findUnique({
    where: { guildId: guild.id }
  });
  const detectedDefaults = detectGuildDefaults(guild);

  if (existing) {
    const missingDefaults = Object.fromEntries(
      Object.entries(detectedDefaults).filter(([key, value]) => {
        return Boolean(value) && !existing[key as keyof GuildConfig];
      })
    );

    if (existing.guildName !== guild.name || Object.keys(missingDefaults).length > 0) {
      return prisma.guildConfig.update({
        where: { guildId: guild.id },
        data: {
          guildName: guild.name,
          ...missingDefaults
        }
      });
    }

    return existing;
  }

  return prisma.guildConfig.create({
    data: {
      guildId: guild.id,
      guildName: guild.name,
      branchName: guild.name,
      language: defaultLanguageFromGuildName(guild.name),
      timezone: defaultTimezoneFromGuildName(guild.name),
      ...detectedDefaults
    }
  });
}

export async function updateGuildConfig(
  guild: Guild,
  data: Partial<Pick<
    GuildConfig,
    | "branchName"
    | "language"
    | "timezone"
    | "logChannelId"
    | "welcomeChannelId"
    | "ticketCategoryId"
    | "applicationCategoryId"
    | "privateVoiceCategoryId"
    | "supportRoleId"
    | "staffRoleId"
    | "adminRoleId"
  >>
): Promise<GuildConfig> {
  await ensureGuildConfig(guild);

  return prisma.guildConfig.update({
    where: { guildId: guild.id },
    data: {
      ...data,
      guildName: guild.name
    }
  });
}

export async function resolveConfiguredCategoryId(
  guild: Guild,
  categoryId?: string | null
): Promise<string | undefined> {
  if (!categoryId) {
    return undefined;
  }

  const channel = await guild.channels.fetch(categoryId).catch(() => null);
  return channel?.type === ChannelType.GuildCategory ? channel.id : undefined;
}

export function normalizeConfigLanguage(value: string | null | undefined): Language | undefined {
  if (value === "en" || value === "tr") {
    return value;
  }

  return undefined;
}
