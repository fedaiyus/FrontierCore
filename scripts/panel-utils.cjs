require("dotenv/config");

const { PrismaClient } = require("@prisma/client");

const API_VERSION = "10";
const API_BASE = `https://discord.com/api/v${API_VERSION}`;
const FRONTIER_GOLD = 0xd4af37;
const OFFICIAL_STAFF_ROLES = {
  "1456824461482262640": "1456826025609658450",
  "1516339966710513685": "1516339966719037528"
};
const passthroughValueFlags = new Set(["--type"]);

function normalizeLanguage(value) {
  return value === "tr" ? "tr" : "en";
}

function readCommonArgs(argv, defaults = {}) {
  const args = {
    channelId: defaults.channelId,
    guildId: defaults.guildId,
    language: undefined,
    messageId: undefined,
    roleId: defaults.roleId
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--edit") {
      args.messageId = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === "--guild") {
      args.guildId = argv[index + 1] ?? args.guildId;
      index += 1;
      continue;
    }

    if (value === "--channel") {
      args.channelId = argv[index + 1] ?? args.channelId;
      index += 1;
      continue;
    }

    if (value === "--language" || value === "--lang") {
      args.language = normalizeLanguage(argv[index + 1]);
      index += 1;
      continue;
    }

    if (value === "--role") {
      args.roleId = argv[index + 1] ?? args.roleId;
      index += 1;
      continue;
    }

    if (passthroughValueFlags.has(value)) {
      index += 1;
      continue;
    }

    if (value && !value.startsWith("--")) {
      args.channelId = value;
    }
  }

  return args;
}

async function resolveLanguage(guildId, override) {
  if (override) {
    return normalizeLanguage(override);
  }

  if (!guildId) {
    return "en";
  }

  const prisma = new PrismaClient();

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId },
      select: { language: true }
    });

    return normalizeLanguage(config?.language);
  } catch {
    return "en";
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function resolveStaffRoleId(guildId, override) {
  if (override) {
    return override;
  }

  if (!guildId) {
    return undefined;
  }

  const prisma = new PrismaClient();

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId },
      select: {
        staffRoleId: true,
        supportRoleId: true,
        adminRoleId: true
      }
    });

    return config?.staffRoleId
      ?? config?.supportRoleId
      ?? OFFICIAL_STAFF_ROLES[guildId]
      ?? config?.adminRoleId
      ?? undefined;
  } catch {
    return OFFICIAL_STAFF_ROLES[guildId];
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function fetchRoleColor(token, guildId, roleId, fallback = FRONTIER_GOLD) {
  if (!guildId || !roleId) {
    return fallback;
  }

  const response = await fetch(`${API_BASE}/guilds/${guildId}/roles`, {
    headers: {
      Authorization: `Bot ${token}`
    }
  }).catch(() => null);

  if (!response?.ok) {
    return fallback;
  }

  const roles = await response.json().catch(() => []);
  const role = Array.isArray(roles) ? roles.find((entry) => entry.id === roleId) : null;
  return role?.color || fallback;
}

async function sendDiscordRequest(token, channelId, payload, messageId) {
  if (!channelId) {
    throw new Error("Channel ID is required.");
  }

  const endpoint = messageId
    ? `${API_BASE}/channels/${channelId}/messages/${messageId}`
    : `${API_BASE}/channels/${channelId}/messages`;

  const response = await fetch(endpoint, {
    method: messageId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  return body;
}

function requireBotToken() {
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    throw new Error("DISCORD_TOKEN is missing from .env");
  }

  return token;
}

module.exports = {
  FRONTIER_GOLD,
  API_BASE,
  fetchRoleColor,
  normalizeLanguage,
  readCommonArgs,
  requireBotToken,
  resolveLanguage,
  resolveStaffRoleId,
  sendDiscordRequest
};
