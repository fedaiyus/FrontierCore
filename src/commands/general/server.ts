import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../types/Command";
import { frontierEmbed } from "../../utils/embeds";
import { t } from "../../i18n";

export const serverCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Show server information.")
    .setDescriptionLocalizations({ tr: "Sunucu bilgilerini gösterir." }),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
      return;
    }

    const owner = await interaction.guild.fetchOwner().catch(() => null);
    const createdTimestamp = Math.floor(interaction.guild.createdTimestamp / 1000);
    const embed = frontierEmbed()
      .setTitle(await t(interaction.guild.id, "server.title", { name: interaction.guild.name }))
      .setDescription(await t(interaction.guild.id, "server.description"))
      .addFields(
        {
          name: await t(interaction.guild.id, "server.members"),
          value: interaction.guild.memberCount.toString(),
          inline: true
        },
        {
          name: await t(interaction.guild.id, "server.channels"),
          value: interaction.guild.channels.cache.size.toString(),
          inline: true
        },
        {
          name: await t(interaction.guild.id, "server.roles"),
          value: interaction.guild.roles.cache.size.toString(),
          inline: true
        },
        {
          name: await t(interaction.guild.id, "server.created"),
          value: `<t:${createdTimestamp}:F>`,
          inline: false
        },
        {
          name: await t(interaction.guild.id, "server.owner"),
          value: owner?.user.toString() ?? (await t(interaction.guild.id, "common.unknown")),
          inline: false
        }
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
