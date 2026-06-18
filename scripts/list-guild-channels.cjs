require("dotenv/config");

const { API_BASE, requireBotToken } = require("./panel-utils.cjs");

async function main() {
  const token = requireBotToken();
  const guildId = process.argv[2];

  if (!guildId) {
    throw new Error("Guild ID is required.");
  }

  const response = await fetch(`${API_BASE}/guilds/${guildId}/channels`, {
    headers: {
      Authorization: `Bot ${token}`
    }
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  const typeNames = {
    0: "text",
    2: "voice",
    4: "category",
    5: "announcement",
    13: "stage",
    15: "forum"
  };

  for (const channel of body.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    const type = typeNames[channel.type] ?? `type-${channel.type}`;
    console.log(`${channel.id}\t${type}\t${channel.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
