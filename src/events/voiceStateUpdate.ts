import { Events, type VoiceState } from "discord.js";
import type { BotEvent } from "../types/Event";
import { cleanupEmptyLounge } from "../modules/lounges";

export const voiceStateUpdateEvent: BotEvent<Events.VoiceStateUpdate> = {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.channelId || oldState.channelId === newState.channelId) {
      return;
    }

    await cleanupEmptyLounge(oldState.guild, oldState.channelId);
  }
};
