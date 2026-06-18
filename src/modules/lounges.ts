import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildBasedChannel,
  type VoiceBasedChannel
} from "discord.js";
import { prisma } from "../database/prisma";
import { ensureGuildConfig, resolveConfiguredCategoryId } from "./guildConfig";
import { sendLog } from "./logging";
import { t } from "../i18n";

async function getOwnedLounge(
  guild: Guild,
  ownerId: string
): Promise<{ roomId: number; channel: VoiceBasedChannel } | null> {
  const room = await prisma.privateVoiceRoom.findFirst({
    where: {
      guildId: guild.id,
      ownerId
    }
  });

  if (!room) {
    return null;
  }

  const channel = await guild.channels.fetch(room.channelId).catch(() => null);

  if (!channel?.isVoiceBased()) {
    await prisma.privateVoiceRoom.delete({ where: { id: room.id } }).catch(() => undefined);
    return null;
  }

  return { roomId: room.id, channel };
}

function assertVoiceChannel(channel: GuildBasedChannel): VoiceBasedChannel {
  if (!channel.isVoiceBased()) {
    throw new Error("Expected a voice channel.");
  }

  return channel;
}

export async function createLounge(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
    return;
  }

  const existing = await getOwnedLounge(interaction.guild, interaction.user.id);

  if (existing) {
    await interaction.reply({
      content: await t(interaction.guild.id, "lounge.alreadyOwned", { channel: existing.channel.toString() }),
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const config = await ensureGuildConfig(interaction.guild);
  const parent = await resolveConfiguredCategoryId(interaction.guild, config.privateVoiceCategoryId);
  const requestedName = interaction.options.getString("name");
  const name = requestedName || (await t(interaction.guild.id, "lounge.defaultName", { user: interaction.user.username }));

  const channel = assertVoiceChannel(
    await interaction.guild.channels.create({
      name: name.slice(0, 100),
      type: ChannelType.GuildVoice,
      parent,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.Connect]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.Stream,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ]
    })
  );

  await prisma.privateVoiceRoom.create({
    data: {
      guildId: interaction.guild.id,
      ownerId: interaction.user.id,
      channelId: channel.id
    }
  });

  await interaction.reply({
    content: await t(interaction.guild.id, "lounge.created", { channel: channel.toString() }),
    flags: MessageFlags.Ephemeral
  });
}

async function requireOwnedLounge(interaction: ChatInputCommandInteraction): Promise<VoiceBasedChannel | null> {
  if (!interaction.guild) {
    await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
    return null;
  }

  const owned = await getOwnedLounge(interaction.guild, interaction.user.id);

  if (!owned) {
    await interaction.reply({ content: await t(interaction.guild.id, "lounge.notFound"), flags: MessageFlags.Ephemeral });
    return null;
  }

  return owned.channel;
}

export async function lockLounge(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = await requireOwnedLounge(interaction);

  if (!channel || !interaction.guild) {
    return;
  }

  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
    Connect: false
  });

  await interaction.reply({ content: await t(interaction.guild.id, "lounge.locked"), flags: MessageFlags.Ephemeral });
}

export async function unlockLounge(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = await requireOwnedLounge(interaction);

  if (!channel || !interaction.guild) {
    return;
  }

  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
    Connect: true
  });

  await interaction.reply({ content: await t(interaction.guild.id, "lounge.unlocked"), flags: MessageFlags.Ephemeral });
}

export async function inviteToLounge(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = await requireOwnedLounge(interaction);

  if (!channel || !interaction.guild) {
    return;
  }

  const user = interaction.options.getUser("user", true);

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    Connect: true,
    Speak: true,
    Stream: true
  });

  await interaction.reply({
    content: await t(interaction.guild.id, "lounge.invited", { user: user.toString() }),
    flags: MessageFlags.Ephemeral
  });
}

export async function renameLounge(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = await requireOwnedLounge(interaction);

  if (!channel || !interaction.guild) {
    return;
  }

  const name = interaction.options.getString("name", true).slice(0, 100);
  await channel.setName(name);
  await interaction.reply({ content: await t(interaction.guild.id, "lounge.renamed", { name }), flags: MessageFlags.Ephemeral });
}

export async function cleanupEmptyLounge(guild: Guild, channelId: string): Promise<void> {
  const room = await prisma.privateVoiceRoom.findUnique({
    where: { channelId }
  });

  if (!room) {
    return;
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);

  if (channel?.isVoiceBased() && channel.members.size > 0) {
    return;
  }

  await channel?.delete("Frontier Core private lounge cleanup").catch(() => undefined);
  await prisma.privateVoiceRoom.delete({ where: { id: room.id } }).catch(() => undefined);
  await sendLog(guild, "log.voiceDeleted", [
    { name: await t(guild.id, "log.channel"), value: channel?.name ?? channelId }
  ]);
}
