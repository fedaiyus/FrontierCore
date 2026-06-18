import { ActivityType, type Client, type PresenceData } from "discord.js";

const PRESENCE_INTERVAL_MS = 60_000;

const presenceRotation: PresenceData[] = [
  {
    status: "online",
    activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: "USA • Australia • Turkiye" }]
  },
  {
    status: "online",
    activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: "Roblox • Garry's Mod • Rust • FiveM" }]
  },
  {
    status: "online",
    activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: "Frontier Networks expansion" }]
  },
  {
    status: "online",
    activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: "/help • tickets • applications" }]
  }
];

let presenceInterval: NodeJS.Timeout | undefined;

export function startPresenceRotation(client: Client<true>): void {
  let index = 0;

  const applyPresence = () => {
    client.user.setPresence(presenceRotation[index]);
    index = (index + 1) % presenceRotation.length;
  };

  if (presenceInterval) {
    clearInterval(presenceInterval);
  }

  applyPresence();
  presenceInterval = setInterval(applyPresence, PRESENCE_INTERVAL_MS);
  presenceInterval.unref();
}
