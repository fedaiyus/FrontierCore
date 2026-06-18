import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type GuildTextBasedChannel,
  MessageFlags,
  PermissionFlagsBits,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildBasedChannel,
  type OverwriteResolvable,
  type User
} from "discord.js";
import { TICKET_DELETE_DELAY_SECONDS } from "../config/constants";
import {
  officialStaffRoleId,
  officialSupportPanelChannelId
} from "../config/frontierOfficial";
import { prisma } from "../database/prisma";
import { ensureGuildConfig, resolveConfiguredCategoryId } from "./guildConfig";
import { createModerationLog } from "./moderation";
import { frontierEmbed } from "../utils/embeds";
import { isStaffMember } from "../utils/permissions";
import { slugifyChannelName } from "../utils/text";
import { t } from "../i18n";

export const ticketTypes = ["general", "rank", "report", "bug", "donation"] as const;
export type TicketType = (typeof ticketTypes)[number];

const ticketTypeLabelKeys: Record<TicketType, string> = {
  general: "ticket.typeGeneral",
  rank: "ticket.typeRank",
  report: "ticket.typeReport",
  bug: "ticket.typeBug",
  donation: "ticket.typeDonation"
};

async function ticketAccentColor(guild: Guild): Promise<number> {
  const config = await ensureGuildConfig(guild);
  const roleId = officialStaffRoleId(guild.id, config.staffRoleId ?? config.supportRoleId ?? config.adminRoleId);

  if (!roleId) {
    return 0xd4af37;
  }

  const role = guild.roles.cache.get(roleId) ?? await guild.roles.fetch(roleId).catch(() => null);

  return role?.color || 0xd4af37;
}

export function isTicketType(value: string): value is TicketType {
  return ticketTypes.includes(value as TicketType);
}

export function ticketChoices(): Array<{ name: string; nameLocalizations: { tr: string }; value: TicketType }> {
  return [
    { name: "General Support", nameLocalizations: { tr: "Genel Destek" }, value: "general" },
    { name: "Rank Request", nameLocalizations: { tr: "Rütbe Talebi" }, value: "rank" },
    { name: "Player Report", nameLocalizations: { tr: "Oyuncu Şikayeti" }, value: "report" },
    { name: "Bug Report", nameLocalizations: { tr: "Hata Bildirimi" }, value: "bug" },
    { name: "Donation Support", nameLocalizations: { tr: "Bağış Desteği" }, value: "donation" }
  ];
}

async function ticketPanelRows(guildId: string): Promise<ActionRowBuilder<ButtonBuilder>[]> {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:create:general")
        .setEmoji("💬")
        .setLabel(await t(guildId, "ticket.typeGeneral"))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket:create:rank")
        .setEmoji("🎖️")
        .setLabel(await t(guildId, "ticket.typeRank"))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("ticket:create:report")
        .setEmoji("🛡️")
        .setLabel(await t(guildId, "ticket.typeReport"))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket:create:bug")
        .setEmoji("🛠️")
        .setLabel(await t(guildId, "ticket.typeBug"))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("ticket:create:donation")
        .setEmoji("💛")
        .setLabel(await t(guildId, "ticket.typeDonation"))
        .setStyle(ButtonStyle.Success)
    )
  ];
}

async function ticketControlRow(guildId: string, ticketId: number): Promise<ActionRowBuilder<ButtonBuilder>> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket:claim:${ticketId}`)
      .setLabel(await t(guildId, "ticket.claimButton"))
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ticket:close:${ticketId}`)
      .setLabel(await t(guildId, "ticket.closeButton"))
      .setStyle(ButtonStyle.Danger)
  );
}

async function ticketPermissionOverwrites(guild: Guild, userId: string): Promise<OverwriteResolvable[]> {
  const config = await ensureGuildConfig(guild);
  const overwrites: OverwriteResolvable[] = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    }
  ];

  for (const roleId of [config.supportRoleId, config.staffRoleId, config.adminRoleId]) {
    if (!roleId) {
      continue;
    }

    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages
      ]
    });
  }

  return overwrites;
}

export async function postTicketPanel(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || !interaction.channel?.isTextBased() || !("send" in interaction.channel)) {
    await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
    return;
  }

  const officialChannelId = officialSupportPanelChannelId(interaction.guild.id);
  const targetChannel = officialChannelId
    ? await interaction.guild.channels.fetch(officialChannelId).catch(() => null)
    : interaction.channel;

  if (!targetChannel?.isTextBased() || !("send" in targetChannel)) {
    await interaction.reply({ content: await t(interaction.guild.id, "ticket.panelChannelMissing"), flags: MessageFlags.Ephemeral });
    return;
  }

  const embed = frontierEmbed(await ticketAccentColor(interaction.guild))
    .setTitle(await t(interaction.guild.id, "ticket.panelTitle"))
    .setDescription(await t(interaction.guild.id, "ticket.panelDescription"));

  await (targetChannel as GuildTextBasedChannel).send({
    embeds: [embed],
    components: await ticketPanelRows(interaction.guild.id)
  });

  await interaction.reply({
    content: await t(interaction.guild.id, "ticket.panelSent", { channel: targetChannel.toString() }),
    flags: MessageFlags.Ephemeral
  });
}

export async function createTicketChannel(
  guild: Guild,
  user: User,
  type: TicketType
): Promise<GuildBasedChannel> {
  const config = await ensureGuildConfig(guild);
  const parent = await resolveConfiguredCategoryId(guild, config.ticketCategoryId);
  const typeLabel = await t(guild.id, ticketTypeLabelKeys[type]);
  const name = slugifyChannelName(`ticket-${type}-${user.username}`) || `ticket-${type}`;

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent,
    topic: `Frontier ticket | ${typeLabel} | ${user.id}`,
    permissionOverwrites: await ticketPermissionOverwrites(guild, user.id)
  });

  const ticket = await prisma.ticket.create({
    data: {
      guildId: guild.id,
      channelId: channel.id,
      userId: user.id,
      type,
      status: "open"
    }
  });

  const embed = frontierEmbed(await ticketAccentColor(guild))
    .setTitle(await t(guild.id, "ticket.welcomeTitle"))
    .setDescription(await t(guild.id, "ticket.welcomeDescription", { user: user.toString() }))
    .addFields({
      name: `🎫 ${await t(guild.id, "ticket.ticketDetails")}`,
      value: [
        `**${await t(guild.id, "ticket.ticketType")}:** ${typeLabel}`,
        `**${await t(guild.id, "ticket.openedBy")}:** ${user.toString()}`,
        `-# ${await t(guild.id, "ticket.staffHint")}`
      ].join("\n")
    });

  await channel.send({
    content: user.toString(),
    embeds: [embed],
    components: [await ticketControlRow(guild.id, ticket.id)]
  });

  return channel;
}

export async function createTicketFromInteraction(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  type: TicketType
): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    const channel = await createTicketChannel(interaction.guild, interaction.user, type);
    await interaction.reply({
      content: await t(interaction.guild.id, "ticket.createSuccess", { channel: channel.toString() }),
      flags: MessageFlags.Ephemeral
    });
  } catch {
    await interaction.reply({
      content: await t(interaction.guild.id, "ticket.createFailed"),
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function handleTicketButton(interaction: ButtonInteraction): Promise<boolean> {
  const [, action, rawValue] = interaction.customId.split(":");

  if (!interaction.guild || action === undefined || rawValue === undefined) {
    return false;
  }

  if (action === "create" && isTicketType(rawValue)) {
    await createTicketFromInteraction(interaction, rawValue);
    return true;
  }

  if (action !== "claim" && action !== "close") {
    return false;
  }

  const ticketId = Number(rawValue);
  const ticket = Number.isInteger(ticketId)
    ? await prisma.ticket.findUnique({ where: { id: ticketId } })
    : null;

  if (!ticket) {
    await interaction.reply({ content: await t(interaction.guild.id, "ticket.notFound"), flags: MessageFlags.Ephemeral });
    return true;
  }

  if (!(await isStaffMember(interaction.guild, interaction.user.id))) {
    await interaction.reply({ content: await t(interaction.guild.id, "common.staffOnly"), flags: MessageFlags.Ephemeral });
    return true;
  }

  if (action === "claim") {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { claimedBy: interaction.user.id }
    });

    await createModerationLog({
      guildId: interaction.guild.id,
      userId: ticket.userId,
      moderatorId: interaction.user.id,
      action: "ticket_claim",
      reason: ticket.type
    });

    await interaction.reply({
      content: await t(interaction.guild.id, "ticket.claimed", { user: interaction.user.toString() })
    });
    return true;
  }

  if (ticket.status === "closed") {
    await interaction.reply({ content: await t(interaction.guild.id, "ticket.alreadyClosed"), flags: MessageFlags.Ephemeral });
    return true;
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "closed",
      closedAt: new Date()
    }
  });

  await createModerationLog({
    guildId: interaction.guild.id,
    userId: ticket.userId,
    moderatorId: interaction.user.id,
    action: "ticket_close",
    reason: ticket.type
  });

  if (interaction.channel && "permissionOverwrites" in interaction.channel) {
    await interaction.channel.permissionOverwrites
      .edit(ticket.userId, {
        SendMessages: false,
        ViewChannel: false
      })
      .catch(() => undefined);
  }

  await interaction.message.edit({ components: [] }).catch(() => undefined);

  await interaction.reply({
    content: await t(interaction.guild.id, "ticket.closed", {
      user: interaction.user.toString(),
      seconds: TICKET_DELETE_DELAY_SECONDS
    })
  });

  const channel = interaction.channel;

  if (channel && channel.id === ticket.channelId && "delete" in channel) {
    setTimeout(() => {
      void channel.delete("Frontier Core ticket closed").catch(async () => {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: "delete_failed" }
        }).catch(() => undefined);
      });
    }, TICKET_DELETE_DELAY_SECONDS * 1000);
  } else {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "delete_failed" }
    }).catch(() => undefined);
  }

  return true;
}
