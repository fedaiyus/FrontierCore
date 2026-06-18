import type { Client } from "discord.js";
import type { AnyBotEvent } from "../types/Event";
import { guildCreateEvent } from "./guildCreate";
import { guildMemberAddEvent } from "./guildMemberAdd";
import { guildMemberRemoveEvent } from "./guildMemberRemove";
import { interactionCreateEvent } from "./interactionCreate";
import { messageDeleteEvent } from "./messageDelete";
import { readyEvent } from "./ready";
import { voiceStateUpdateEvent } from "./voiceStateUpdate";

const events: AnyBotEvent[] = [
  readyEvent,
  interactionCreateEvent,
  guildCreateEvent,
  guildMemberAddEvent,
  guildMemberRemoveEvent,
  voiceStateUpdateEvent,
  messageDeleteEvent
];

export function registerEvents(client: Client): void {
  for (const event of events) {
    const handler = (...args: any[]) => {
      void event.execute(...args);
    };

    if (event.once) {
      client.once(event.name, handler);
      continue;
    }

    client.on(event.name, handler);
  }
}
