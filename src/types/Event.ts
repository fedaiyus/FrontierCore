import type { ClientEvents } from "discord.js";

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<void> | void;
}

export interface AnyBotEvent {
  name: keyof ClientEvents;
  once?: boolean;
  execute(...args: any[]): Promise<void> | void;
}
