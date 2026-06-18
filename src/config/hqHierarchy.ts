import { ChannelType, type Guild } from "discord.js";
import type { GuildConfig } from "@prisma/client";
import {
  FRONTIER_HQ_GUILD_ID,
  FRONTIER_HQ_ROLES,
  FRONTIER_TURKIYE_GUILD_ID,
  FRONTIER_TURKIYE_ROLES
} from "./frontierOfficial";
import { looksTurkish } from "../utils/language";

type GuildConfigDefaults = Partial<
  Pick<
    GuildConfig,
    | "logChannelId"
    | "welcomeChannelId"
    | "ticketCategoryId"
    | "applicationCategoryId"
    | "privateVoiceCategoryId"
    | "staffRoleId"
  >
>;

export const HQ_HIERARCHY = {
  categories: {
    information: "Information",
    community: "Community",
    support: "Support",
    feedback: "Feedback",
    staff: "Staff",
    personalVcs: "Personal VCs",
    upperEchelon: "Upper Echelon"
  },
  channels: {
    rules: "rules",
    announcements: "announcements",
    developerShowcase: "developer-showcase",
    general: "general",
    ticketPanel: "ticket",
    rankRequest: "rank-request",
    suggestions: "suggestions",
    polls: "polls",
    staffAnnouncements: "staff-announcements",
    gameMasterAnnouncements: "game-master-announcements",
    staffChat: "staff-chat",
    gameMasterChat: "game-master-chat",
    proofArchive: "proof-archive",
    autoModLog: "auto-mod-log",
    discordModerationUpdates: "discord-moderation-updates"
  }
} as const;

export const TURKIYE_HIERARCHY = {
  categories: {
    information: "Bilgilendirme",
    community: "Topluluk",
    fivem: "FiveM",
    lspd: "LSPD",
    ems: "EMS",
    support: "Destek Merkezi",
    feedback: "Geri Bildirim",
    staff: "Yetkili Merkezi",
    privateRooms: "Ozel Odalar",
    board: "Yonetim Kurulu"
  },
  channels: {
    rules: "kurallar",
    announcements: "duyurular",
    general: "genel-sohbet",
    chatTwo: "sohbet-2",
    media: "medya-ve-klip",
    fivemAnnouncements: "fivem-duyurular",
    roleGuide: "rol-rehberi",
    characterRecords: "karakter-kayitlari",
    wanted: "arananlar",
    lspdApplication: "lspd-basvuru",
    lspdChat: "lspd-sohbet",
    evidenceArchive: "delil-arsivi",
    injured: "yaralilar",
    emsApplication: "ems-basvuru",
    emsChat: "ems-sohbet",
    ticketPanel: "destek-talebi",
    rankRequest: "rutbe-talebi",
    suggestions: "oneriler",
    polls: "anketler",
    staffChat: "yetkili-sohbet",
    roleManagerChat: "rol-yoneticisi-sohbet",
    proofArchive: "kanit-arsivi",
    autoModLog: "otomod-kayitlari",
    moderationUpdates: "moderasyon-guncellemeleri"
  }
} as const;

function normalizeDiscordName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(actual: string, expected: string): boolean {
  const normalizedActual = normalizeDiscordName(actual);
  const normalizedExpected = normalizeDiscordName(expected);
  return normalizedActual === normalizedExpected || normalizedActual.endsWith(` ${normalizedExpected}`);
}

function findCategoryId(guild: Guild, names: string[]): string | undefined {
  return guild.channels.cache.find((channel) => {
    return channel.type === ChannelType.GuildCategory && names.some((name) => namesMatch(channel.name, name));
  })?.id;
}

function findTextChannelId(guild: Guild, names: string[]): string | undefined {
  return guild.channels.cache.find((channel) => {
    return channel.type === ChannelType.GuildText && names.some((name) => namesMatch(channel.name, name));
  })?.id;
}

export function detectHqGuildDefaults(guild: Guild): GuildConfigDefaults {
  const supportCategoryId = findCategoryId(guild, [HQ_HIERARCHY.categories.support]);
  const personalVcsCategoryId = findCategoryId(guild, [HQ_HIERARCHY.categories.personalVcs]);
  const generalChannelId = findTextChannelId(guild, [HQ_HIERARCHY.channels.general]);
  const logChannelId = findTextChannelId(guild, [
    HQ_HIERARCHY.channels.autoModLog,
    HQ_HIERARCHY.channels.discordModerationUpdates,
    HQ_HIERARCHY.channels.staffChat
  ]);

  return {
    logChannelId,
    welcomeChannelId: generalChannelId,
    ticketCategoryId: supportCategoryId,
    applicationCategoryId: supportCategoryId,
    privateVoiceCategoryId: personalVcsCategoryId,
    staffRoleId: guild.id === FRONTIER_HQ_GUILD_ID ? FRONTIER_HQ_ROLES.staffTeam : undefined
  };
}

export function detectTurkiyeGuildDefaults(guild: Guild): GuildConfigDefaults {
  const fivemCategoryId = findCategoryId(guild, [TURKIYE_HIERARCHY.categories.fivem]);
  const supportCategoryId = findCategoryId(guild, [TURKIYE_HIERARCHY.categories.support]);
  const privateRoomsCategoryId = findCategoryId(guild, [TURKIYE_HIERARCHY.categories.privateRooms]);
  const generalChannelId = findTextChannelId(guild, [TURKIYE_HIERARCHY.channels.general]);
  const logChannelId = findTextChannelId(guild, [
    TURKIYE_HIERARCHY.channels.autoModLog,
    TURKIYE_HIERARCHY.channels.moderationUpdates,
    TURKIYE_HIERARCHY.channels.staffChat
  ]);

  return {
    logChannelId,
    welcomeChannelId: generalChannelId,
    ticketCategoryId: supportCategoryId,
    applicationCategoryId: fivemCategoryId ?? supportCategoryId,
    privateVoiceCategoryId: privateRoomsCategoryId,
    staffRoleId: guild.id === FRONTIER_TURKIYE_GUILD_ID ? FRONTIER_TURKIYE_ROLES.staffTeam : undefined
  };
}

export function detectGuildDefaults(guild: Guild): GuildConfigDefaults {
  const isTurkiyeGuild = looksTurkish(guild.name)
    || Boolean(findCategoryId(guild, [TURKIYE_HIERARCHY.categories.fivem, TURKIYE_HIERARCHY.categories.support]));

  return isTurkiyeGuild ? detectTurkiyeGuildDefaults(guild) : detectHqGuildDefaults(guild);
}
