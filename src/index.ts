import { env } from "./config/env";
import { createBotClient } from "./client";
import { prisma } from "./database/prisma";
import { registerEvents } from "./events";

async function main(): Promise<void> {
  const client = createBotClient();
  registerEvents(client);

  await client.login(env.DISCORD_TOKEN);

  const shutdown = async () => {
    client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
