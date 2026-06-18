import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags
} from "discord.js";
import { prisma } from "../database/prisma";
import { ensureGuildConfig } from "./guildConfig";
import { createModerationLog } from "./moderation";
import { frontierEmbed } from "../utils/embeds";
import { isStaffMember } from "../utils/permissions";
import { t } from "../i18n";
import { officialLogChannelId, officialStaffRoleId } from "../config/frontierOfficial";
import { truncate } from "../utils/text";

async function staffAccentColor(interaction: ChatInputCommandInteraction, roleId?: string | null): Promise<number> {
  if (!interaction.guild) {
    return 0xd4af37;
  }

  const resolvedRoleId = officialStaffRoleId(interaction.guild.id, roleId);

  if (!resolvedRoleId) {
    return 0xd4af37;
  }

  const role = interaction.guild.roles.cache.get(resolvedRoleId)
    ?? await interaction.guild.roles.fetch(resolvedRoleId).catch(() => null);

  return role?.color || 0xd4af37;
}

async function sendRankRequestLog(
  interaction: ChatInputCommandInteraction,
  rankRequestId: number,
  requestedRoleId: string,
  reason: string
): Promise<void> {
  if (!interaction.guild) {
    return;
  }

  const config = await ensureGuildConfig(interaction.guild);
  const channelId = officialLogChannelId(interaction.guild.id, config.logChannelId);

  if (!channelId) {
    return;
  }

  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

  if (!channel?.isTextBased()) {
    return;
  }

  const createdTimestamp = Math.floor(Date.now() / 1000);
  const embed = frontierEmbed(await staffAccentColor(interaction, config.staffRoleId ?? config.supportRoleId ?? config.adminRoleId))
    .setDescription(
      [
        `# 🎖️ ${await t(interaction.guild.id, "rank.logTitle")}`,
        `## ${interaction.user.username}`,
        `-# ${await t(interaction.guild.id, "rank.submittedAt")}: <t:${createdTimestamp}:F>`
      ].join("\n")
    )
    .addFields(
      {
        name: `👤 ${await t(interaction.guild.id, "rank.applicant")}`,
        value: [
          `**${await t(interaction.guild.id, "rank.user")}:** ${interaction.user.toString()}`,
          `**${await t(interaction.guild.id, "rank.discordTag")}:** \`${interaction.user.tag}\``,
          `**${await t(interaction.guild.id, "rank.discordId")}:** \`${interaction.user.id}\``
        ].join("\n"),
        inline: false
      },
      {
        name: `🎖️ ${await t(interaction.guild.id, "rank.requestedRole")}`,
        value: `<@&${requestedRoleId}>`
      },
      {
        name: `📝 ${await t(interaction.guild.id, "rank.reason")}`,
        value: `> ${truncate(reason).replace(/\r?\n/g, "\n> ")}`
      }
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`rank:approve:${rankRequestId}`)
      .setLabel(await t(interaction.guild.id, "rank.approveButton"))
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`rank:deny:${rankRequestId}`)
      .setLabel(await t(interaction.guild.id, "rank.denyButton"))
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds: [embed], components: [row] }).catch(() => undefined);
}

export async function submitRankRequest(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
    return;
  }

  const role = interaction.options.getRole("role", true);
  const reason = interaction.options.getString("reason", true);

  const request = await prisma.rankRequest.create({
    data: {
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      requestedRoleId: role.id,
      reason,
      status: "pending"
    }
  });

  await sendRankRequestLog(interaction, request.id, role.id, reason);
  await interaction.reply({ content: await t(interaction.guild.id, "rank.submitted"), flags: MessageFlags.Ephemeral });
}

export async function handleRankButton(interaction: ButtonInteraction): Promise<boolean> {
  const [, action, rawId] = interaction.customId.split(":");

  if ((action !== "approve" && action !== "deny") || !rawId || !interaction.guild) {
    return false;
  }

  if (!(await isStaffMember(interaction.guild, interaction.user.id))) {
    await interaction.reply({ content: await t(interaction.guild.id, "common.staffOnly"), flags: MessageFlags.Ephemeral });
    return true;
  }

  const requestId = Number(rawId);

  if (!Number.isInteger(requestId)) {
    return false;
  }

  const status = action === "approve" ? "approved" : "denied";
  const request = await prisma.rankRequest.update({
    where: { id: requestId },
    data: {
      status,
      reviewedBy: interaction.user.id,
      reviewedAt: new Date()
    }
  });

  let messageKey = "rank.reviewed";

  if (status === "approved") {
    const member = await interaction.guild.members.fetch(request.userId).catch(() => null);
    await member?.roles.add(request.requestedRoleId).then(() => {
      messageKey = "rank.roleApplied";
    }).catch(() => undefined);
  }

  await createModerationLog({
    guildId: interaction.guild.id,
    userId: request.userId,
    moderatorId: interaction.user.id,
    action: `rank_${status}`,
    reason: request.reason
  });

  await interaction.update({ components: [] }).catch(() => undefined);
  await interaction.followUp({
    content:
      messageKey === "rank.roleApplied"
        ? await t(interaction.guild.id, messageKey)
        : await t(interaction.guild.id, messageKey, {
            status: await t(interaction.guild.id, status === "approved" ? "rank.statusApproved" : "rank.statusDenied")
          }),
    flags: MessageFlags.Ephemeral
  });

  return true;
}
