export const BRAND = {
  botName: "Frontier Core",
  networkName: "Frontier Networks",
  gold: 0xd4af37,
  logoUrl: process.env.FRONTIER_LOGO_URL || undefined,
  coverUrl: process.env.FRONTIER_COVER_URL || undefined
} as const;

export const DISCORD_LIMITS = {
  embedDescription: 4096,
  embedFieldValue: 1024,
  channelName: 100
} as const;

export const TICKET_DELETE_DELAY_SECONDS = 5;
