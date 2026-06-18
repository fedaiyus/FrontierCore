import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  DISCORD_TOKEN: requireEnv("DISCORD_TOKEN"),
  DISCORD_CLIENT_ID: requireEnv("DISCORD_CLIENT_ID"),
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
  FRONTIER_LOGO_URL: process.env.FRONTIER_LOGO_URL
};
