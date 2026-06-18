import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../types/Command";
import { frontierEmbed } from "../../utils/embeds";
import { t } from "../../i18n";

export const helpCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show Frontier Core commands.")
    .setDescriptionLocalizations({ tr: "Frontier Core komutlarını gösterir." }),
  async execute(interaction) {
    const guildId = interaction.guildId;
    const embed = frontierEmbed()
      .setTitle(await t(guildId, "help.title"))
      .setDescription(await t(guildId, "help.description"))
      .addFields(
        {
          name: await t(guildId, "help.general"),
          value: await t(guildId, "help.generalCommands")
        },
        {
          name: await t(guildId, "help.support"),
          value: await t(guildId, "help.supportCommands")
        },
        {
          name: await t(guildId, "help.applications"),
          value: await t(guildId, "help.applicationCommands")
        },
        {
          name: await t(guildId, "help.lounges"),
          value: await t(guildId, "help.loungeCommands")
        },
        {
          name: await t(guildId, "help.admin"),
          value: await t(guildId, "help.adminCommands")
        }
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
