import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../types/Command";
import { prisma } from "../../database/prisma";
import { frontierEmbed } from "../../utils/embeds";
import { formatDuration } from "../../utils/text";
import { t } from "../../i18n";

export const statusCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Show bot runtime status.")
    .setDescriptionLocalizations({ tr: "Bot çalışma durumunu gösterir." }),
  async execute(interaction) {
    await prisma.guildConfig.count();

    const embed = frontierEmbed()
      .setTitle(await t(interaction.guildId, "status.title"))
      .setDescription(await t(interaction.guildId, "status.description"))
      .addFields(
        {
          name: await t(interaction.guildId, "status.latency"),
          value: `${Math.max(0, Math.round(interaction.client.ws.ping))}ms`,
          inline: true
        },
        {
          name: await t(interaction.guildId, "status.uptime"),
          value: formatDuration(process.uptime()),
          inline: true
        },
        {
          name: await t(interaction.guildId, "status.database"),
          value: await t(interaction.guildId, "status.databaseOnline"),
          inline: true
        },
        {
          name: await t(interaction.guildId, "status.guilds"),
          value: interaction.client.guilds.cache.size.toString(),
          inline: true
        }
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
