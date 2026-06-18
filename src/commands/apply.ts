import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types/Command";
import { showApplicationModal } from "../modules/applications";
import { applicationTypes, type ApplicationType } from "../modules/applicationTypes";
import { t } from "../i18n";

export const applyCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("apply")
    .setDescription("Submit a Frontier application.")
    .setDescriptionLocalizations({ tr: "Frontier başvurusu gönderir." })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("whitelist")
        .setDescription("Submit a whitelist application.")
        .setDescriptionLocalizations({ tr: "Whitelist başvurusu gönderir." })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("staff")
        .setDescription("Submit a staff application.")
        .setDescriptionLocalizations({ tr: "Yetkili başvurusu gönderir." })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lspd")
        .setDescription("Submit an LSPD application.")
        .setDescriptionLocalizations({ tr: "LSPD başvurusu gönderir." })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bcso")
        .setDescription("Submit a BCSO application.")
        .setDescriptionLocalizations({ tr: "BCSO başvurusu gönderir." })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ems")
        .setDescription("Submit an EMS application.")
        .setDescriptionLocalizations({ tr: "EMS başvurusu gönderir." })
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
      return;
    }

    const type = interaction.options.getSubcommand() as ApplicationType;

    if (!applicationTypes.includes(type)) {
      await interaction.reply({ content: await t(interaction.guildId, "common.error"), flags: MessageFlags.Ephemeral });
      return;
    }

    await showApplicationModal(interaction, type);
  }
};
