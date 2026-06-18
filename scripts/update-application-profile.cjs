const fs = require("node:fs");
const path = require("node:path");
require("dotenv/config");

const API_VERSION = "10";
const API_BASE = `https://discord.com/api/v${API_VERSION}`;

const profile = {
  description: [
    "Frontier Core is the official Discord bot developed by Frontier Networks.",
    "",
    "Support Tickets • Applications • Rank Requests • Staff Operations",
    "",
    "Supporting Frontier communities across USA, Australia, and Türkiye.",
    "Built for Roblox, Garry's Mod, Rust, and FiveM operations."
  ].join("\n"),
  tags: ["frontier", "support", "roleplay", "fivem", "gaming"]
};

function imageData(relativePath) {
  const absolutePath = path.join(__dirname, "..", relativePath);
  const bytes = fs.readFileSync(absolutePath);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    throw new Error("DISCORD_TOKEN is missing from .env");
  }

  const payload = {
    ...profile,
    icon: imageData("assets/logos/FrontierBot.png"),
    cover_image: imageData("assets/covers/FrontierCover.png")
  };

  if (dryRun) {
    console.log("Profile update payload ready:");
    console.log(`- description: ${profile.description.length} characters`);
    console.log(`- tags: ${profile.tags.join(", ")}`);
    console.log("- icon: assets/logos/FrontierBot.png");
    console.log("- cover_image: assets/covers/FrontierCover.png");
    return;
  }

  const response = await fetch(`${API_BASE}/applications/@me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Discord rejected the profile update:");
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log("Discord application profile updated.");
  console.log(`- name: ${body.name}`);
  console.log(`- description: ${body.description?.length ?? 0} characters`);
  console.log(`- tags: ${Array.isArray(body.tags) ? body.tags.join(", ") : "none"}`);
  console.log(`- cover image: ${body.cover_image ? "set" : "not set"}`);
  console.log(`- icon: ${body.icon ? "set" : "not set"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
