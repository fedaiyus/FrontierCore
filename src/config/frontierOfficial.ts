export const FRONTIER_HQ_GUILD_ID = "1456824461482262640";
export const FRONTIER_TURKIYE_GUILD_ID = "1516339966710513685";

export const FRONTIER_HQ_ROLES = {
  staffTeam: "1456826025609658450"
} as const;

export const FRONTIER_TURKIYE_CHANNELS = {
  supportPanel: "1516339970384859262",
  automodLog: "1516339970670071893",
  emsPanel: "1516962618294800416",
  emsReview: "1516989956944302231"
} as const;

export const FRONTIER_TURKIYE_ROLES = {
  staffTeam: "1516339966719037528",
  ems: "1516960457674592416"
} as const;

export const FRONTIER_EMOJIS = {
  networks: "<:FrontierNetworks:1516970587581321407>",
  core: "<:FrontierCore:1516970582384836750>",
  tr: "<:FrontierTR:1516970592564154388>",
  usa: "<:FrontierUSA:1516970594132824284>",
  au: "<:FrontierAU:1516970580820230164>",
  fivem: "<:FrontierFiveM:1516970583752183818>",
  roblox: "<:FrontierRoblox:1516970589129281659>",
  gmod: "<:FrontierGMod:1516970585958125729>",
  rust: "<:FrontierRust:1516970590970580992>"
} as const;

export function officialLogChannelId(guildId: string, fallback?: string | null): string | null {
  return guildId === FRONTIER_TURKIYE_GUILD_ID ? FRONTIER_TURKIYE_CHANNELS.automodLog : fallback ?? null;
}

export function officialSupportPanelChannelId(guildId: string): string | null {
  return guildId === FRONTIER_TURKIYE_GUILD_ID ? FRONTIER_TURKIYE_CHANNELS.supportPanel : null;
}

export function officialStaffRoleId(guildId: string, fallback?: string | null): string | null {
  if (fallback) {
    return fallback;
  }

  if (guildId === FRONTIER_HQ_GUILD_ID) {
    return FRONTIER_HQ_ROLES.staffTeam;
  }

  if (guildId === FRONTIER_TURKIYE_GUILD_ID) {
    return FRONTIER_TURKIYE_ROLES.staffTeam;
  }

  return null;
}
