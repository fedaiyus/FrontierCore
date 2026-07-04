import { ActivityType, type Client, type PresenceData } from "discord.js";
import { prisma } from "../database/prisma";

const PRESENCE_INTERVAL_MS = 60_000;

let presenceInterval: NodeJS.Timeout | undefined;

async function buildPresenceRotation(client: Client<true>): Promise<PresenceData[]> {
  const [openTickets, pendingApplications, pendingRankRequests, activeLounges] =
    await Promise.all([
      prisma.ticket.count({ where: { status: "open" } }),
      prisma.application.count({ where: { status: "pending" } }),
      prisma.rankRequest.count({ where: { status: "pending" } }),
      prisma.privateVoiceRoom.count()
    ]);

  return [
    {
      status: "online",
      activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: "🌐 Frontier Networks" }]
    },
    {
      status: "online",
      activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: "USA • Australia • Türkiye" }]
    },
    {
      status: "online",
      activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: "🎮 Roblox • GMod • Rust • FiveM" }]
    },
    {
      status: "online",
      activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: `🎫 ${openTickets} open tickets` }]
    },
    {
      status: "online",
      activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: `📝 ${pendingApplications} pending applications` }]
    },
    {
      status: "online",
      activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: `⭐ ${pendingRankRequests} rank requests` }]
    },
    {
      status: "online",
      activities: [{ type: ActivityType.Custom, name: "Frontier Core", state: `🎙️ ${activeLounges} active lounges` }]
    },
  ];
}

export function startPresenceRotation(client: Client<true>): void {
  let index = 0;

  const applyPresence = async () => {
    try {
      const rotation = await buildPresenceRotation(client);

      client.user.setPresence(rotation[index]);
      index = (index + 1) % rotation.length;
    } catch (error) {
      console.error("[Presence] Failed to update presence:", error);
    }
  };

  if (presenceInterval) {
    clearInterval(presenceInterval);
  }

  void applyPresence();

  presenceInterval = setInterval(() => {
    void applyPresence();
  }, PRESENCE_INTERVAL_MS);

  presenceInterval.unref();
}
