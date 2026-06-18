import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../types/Command";
import { t } from "../../i18n";

export const pingCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency.")
    .setDescriptionLocalizations({ tr: "Bot gecikmesini kontrol eder." }),
  async execute(interaction) {
    await interaction.reply({
      content: await t(interaction.guildId, "ping.reply", {
        latency: Math.max(0, Math.round(interaction.client.ws.ping))
      }),
      flags: MessageFlags.Ephemeral
    });
  }
};
