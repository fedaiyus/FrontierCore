import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types/Command";
import { t } from "../i18n";

export const loungeCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("lounge")
    .setDescription("Manage temporary private voice lounges.")
    .setDescriptionLocalizations({ tr: "Geçici özel ses odalarını yönetir." })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a private voice lounge.")
        .setDescriptionLocalizations({ tr: "Özel ses odası oluşturur." })
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Optional lounge name.")
            .setDescriptionLocalizations({ tr: "İsteğe bağlı oda adı." })
            .setMaxLength(100)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lock")
        .setDescription("Lock your private lounge.")
        .setDescriptionLocalizations({ tr: "Özel ses odanı kilitler." })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unlock")
        .setDescription("Unlock your private lounge.")
        .setDescriptionLocalizations({ tr: "Özel ses odanın kilidini açar." })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("invite")
        .setDescription("Invite a member to your private lounge.")
        .setDescriptionLocalizations({ tr: "Bir üyeyi özel ses odana davet eder." })
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Member to invite.")
            .setDescriptionLocalizations({ tr: "Davet edilecek üye." })
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rename")
        .setDescription("Rename your private lounge.")
        .setDescriptionLocalizations({ tr: "Özel ses odanın adını değiştirir." })
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("New lounge name.")
            .setDescriptionLocalizations({ tr: "Yeni oda adı." })
            .setRequired(true)
            .setMaxLength(100)
        )
    ),
  async execute(interaction) {
    await interaction.reply({
      content: await t(interaction.guildId, "lounge.inactive"),
      flags: MessageFlags.Ephemeral
    });
  }
};
