import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types/Command";
import { submitRankRequest } from "../modules/rankRequests";

export const rankRequestCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("rank-request")
    .setDescription("Request a Discord role/rank.")
    .setDescriptionLocalizations({ tr: "Discord rolü/rütbesi talep eder." })
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("Requested role.")
        .setDescriptionLocalizations({ tr: "İstenen rol." })
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the request.")
        .setDescriptionLocalizations({ tr: "Talep sebebi." })
        .setRequired(true)
        .setMaxLength(1000)
    ),
  async execute(interaction) {
    await submitRankRequest(interaction);
  }
};
