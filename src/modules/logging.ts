import {
  type Guild,
  type GuildMember,
  type GuildTextBasedChannel,
  type Message
} from "discord.js";
import { BRAND } from "../config/constants";
import { officialLogChannelId, officialStaffRoleId } from "../config/frontierOfficial";
import { frontierEmbed } from "../utils/embeds";
import { truncate } from "../utils/text";
import { ensureGuildConfig } from "./guildConfig";
import { t } from "../i18n";

const LOG_COLORS = {
  join: 0x2ecc71,
  leave: 0xe74c3c,
  moderation: 0x3498db,
  system: BRAND.gold
} as const;

async function roleColor(guild: Guild, roleId: string | null | undefined, fallback: number): Promise<number> {
  if (!roleId) {
    return fallback;
  }

  const role = guild.roles.cache.get(roleId) ?? await guild.roles.fetch(roleId).catch(() => null);
  return role?.color || fallback;
}

async function staffLogColor(guild: Guild, fallback: number): Promise<number> {
  const config = await ensureGuildConfig(guild);
  return roleColor(guild, officialStaffRoleId(guild.id, config.staffRoleId ?? config.supportRoleId ?? config.adminRoleId), fallback);
}

async function getLogChannel(guild: Guild): Promise<GuildTextBasedChannel | null> {
  const config = await ensureGuildConfig(guild);
  const channelId = officialLogChannelId(guild.id, config.logChannelId);

  if (!channelId) {
    return null;
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  return channel?.isTextBased() && "send" in channel ? (channel as GuildTextBasedChannel) : null;
}

function discordTimestamp(date: Date, style: "F" | "R" = "F"): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

export async function sendLog(
  guild: Guild,
  titleKey: string,
  fields: Array<{ name: string; value: string; inline?: boolean }> = [],
  color = BRAND.gold
): Promise<void> {
  const channel = await getLogChannel(guild);

  if (!channel) {
    return;
  }

  const embed = frontierEmbed(await staffLogColor(guild, color))
    .setTitle(await t(guild.id, titleKey));

  if (fields.length > 0) {
    embed.addFields(
      fields.map((field) => ({
        name: field.name,
        value: truncate(field.value || "-"),
        inline: field.inline
      }))
    );
  }

  await channel.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logMemberJoined(member: GuildMember): Promise<void> {
  const channel = await getLogChannel(member.guild);

  if (!channel) {
    return;
  }

  const accountCreated = member.user.createdAt;
  const embed = frontierEmbed(await staffLogColor(member.guild, LOG_COLORS.join))
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ size: 128 }) })
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setDescription(
      [
        `# 🟢 ${await t(member.guild.id, "log.memberJoined")}`,
        `## ${member.user.toString()}`,
        `-# ${await t(member.guild.id, "log.eventTime")}: ${discordTimestamp(new Date())}`
      ].join("\n")
    )
    .addFields(
      {
        name: `👤 ${await t(member.guild.id, "log.user")}`,
        value: [
          `**${await t(member.guild.id, "log.username")}:** \`${member.user.tag}\``,
          `**${await t(member.guild.id, "log.userId")}:** \`${member.id}\``,
          `**${await t(member.guild.id, "log.accountCreated")}:** ${discordTimestamp(accountCreated)} (${discordTimestamp(accountCreated, "R")})`
        ].join("\n"),
        inline: false
      },
      {
        name: `📊 ${await t(member.guild.id, "log.server")}`,
        value: [
          `**${await t(member.guild.id, "log.memberCount")}:** \`${member.guild.memberCount}\``,
          `-# ${await t(member.guild.id, "log.automodReviewHint")}`
        ].join("\n"),
        inline: false
      }
    );

  await channel.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logMemberLeft(member: GuildMember): Promise<void> {
  const channel = await getLogChannel(member.guild);

  if (!channel) {
    return;
  }

  const joinedAt = member.joinedAt;
  const embed = frontierEmbed(await staffLogColor(member.guild, LOG_COLORS.leave))
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ size: 128 }) })
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setDescription(
      [
        `# 🔴 ${await t(member.guild.id, "log.memberLeft")}`,
        `## ${member.user.toString()}`,
        `-# ${await t(member.guild.id, "log.eventTime")}: ${discordTimestamp(new Date())}`
      ].join("\n")
    )
    .addFields(
      {
        name: `👤 ${await t(member.guild.id, "log.user")}`,
        value: [
          `**${await t(member.guild.id, "log.username")}:** \`${member.user.tag}\``,
          `**${await t(member.guild.id, "log.userId")}:** \`${member.id}\``,
          `**${await t(member.guild.id, "log.joinedServer")}:** ${
            joinedAt ? `${discordTimestamp(joinedAt)} (${discordTimestamp(joinedAt, "R")})` : await t(member.guild.id, "common.unknown")
          }`
        ].join("\n"),
        inline: false
      },
      {
        name: `📊 ${await t(member.guild.id, "log.server")}`,
        value: `**${await t(member.guild.id, "log.memberCount")}:** \`${member.guild.memberCount}\``,
        inline: false
      }
    );

  await channel.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logMessageDelete(message: Message): Promise<void> {
  if (!message.guild || message.author?.bot) {
    return;
  }

  const channel = await getLogChannel(message.guild);

  if (!channel) {
    return;
  }

  const embed = frontierEmbed(await staffLogColor(message.guild, LOG_COLORS.moderation))
    .setAuthor({
      name: message.author?.tag ?? await t(message.guild.id, "common.unknown"),
      iconURL: message.author?.displayAvatarURL({ size: 128 })
    })
    .setDescription(
      [
        `# 🧾 ${await t(message.guild.id, "log.messageDeleted")}`,
        `-# ${await t(message.guild.id, "log.eventTime")}: ${discordTimestamp(new Date())}`
      ].join("\n")
    )
    .addFields(
      {
        name: `👤 ${await t(message.guild.id, "log.user")}`,
        value: message.author ? `${message.author.toString()} • \`${message.author.tag}\`\n\`${message.author.id}\`` : await t(message.guild.id, "common.unknown"),
        inline: false
      },
      {
        name: `#️⃣ ${await t(message.guild.id, "log.channel")}`,
        value: message.channel.toString(),
        inline: true
      },
      {
        name: `💬 ${await t(message.guild.id, "log.content")}`,
        value: truncate(message.content || await t(message.guild.id, "common.unknown")),
        inline: false
      }
    );

  await channel.send({ embeds: [embed] }).catch(() => undefined);
}
