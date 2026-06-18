import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types/Command";
import { createTicketFromInteraction, isTicketType, postTicketPanel, ticketChoices } from "../modules/tickets";
import { isStaffMember } from "../utils/permissions";
import { t } from "../i18n";

export const ticketCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open or publish support tickets.")
    .setDescriptionLocalizations({ tr: "Destek ticket işlemleri." })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("panel")
        .setDescription("Post the ticket panel.")
        .setDescriptionLocalizations({ tr: "Ticket panelini gönderir." })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a support ticket.")
        .setDescriptionLocalizations({ tr: "Destek ticketi oluşturur." })
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Ticket type.")
            .setDescriptionLocalizations({ tr: "Ticket türü." })
            .setRequired(true)
            .addChoices(...ticketChoices())
        )
    ),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "panel") {
      if (!(await isStaffMember(interaction.guild, interaction.user.id))) {
        await interaction.reply({ content: await t(interaction.guild.id, "common.staffOnly"), flags: MessageFlags.Ephemeral });
        return;
      }

      await postTicketPanel(interaction);
      return;
    }

    const type = interaction.options.getString("type", true);

    if (!isTicketType(type)) {
      await interaction.reply({ content: await t(interaction.guild.id, "common.error"), flags: MessageFlags.Ephemeral });
      return;
    }

    await createTicketFromInteraction(interaction, type);
  }
};
