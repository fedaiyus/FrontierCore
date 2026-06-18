import { Events, type Message, type PartialMessage } from "discord.js";
import type { BotEvent } from "../types/Event";
import { logMessageDelete } from "../modules/logging";

export const messageDeleteEvent: BotEvent<Events.MessageDelete> = {
  name: Events.MessageDelete,
  async execute(message: Message | PartialMessage) {
    if (message.partial) {
      return;
    }

    await logMessageDelete(message);
  }
};
