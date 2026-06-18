import { Events, MessageFlags, type Interaction } from "discord.js";
import type { BotEvent } from "../types/Event";
import { commandMap } from "../commands";
import { handleApplicationButton, handleApplicationModal } from "../modules/applications";
import { ensureGuildConfig } from "../modules/guildConfig";
import { handleRankButton } from "../modules/rankRequests";
import { handleTicketButton } from "../modules/tickets";
import { t } from "../i18n";

async function replyWithError(interaction: Interaction): Promise<void> {
  if (!interaction.isRepliable()) {
    return;
  }

  const content = await t(interaction.guildId, "common.error");

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral }).catch(() => undefined);
    return;
  }

  await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => undefined);
}

export const interactionCreateEvent: BotEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (interaction.guild) {
      await ensureGuildConfig(interaction.guild);
    }

    try {
      if (interaction.isChatInputCommand()) {
        const command = commandMap.get(interaction.commandName);

        if (!command) {
          await interaction.reply({ content: await t(interaction.guildId, "common.error"), flags: MessageFlags.Ephemeral });
          return;
        }

        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith("ticket:") && (await handleTicketButton(interaction))) {
          return;
        }

        if (interaction.customId.startsWith("application:") && (await handleApplicationButton(interaction))) {
          return;
        }

        if (interaction.customId.startsWith("rank:") && (await handleRankButton(interaction))) {
          return;
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("application:") && (await handleApplicationModal(interaction))) {
          return;
        }
      }
    } catch (error) {
      console.error(error);
      await replyWithError(interaction);
    }
  }
};
