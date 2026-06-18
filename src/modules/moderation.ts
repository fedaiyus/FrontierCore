import { prisma } from "../database/prisma";

export async function createModerationLog(data: {
  guildId: string;
  userId: string;
  moderatorId: string;
  action: string;
  reason?: string;
}): Promise<void> {
  await prisma.moderationLog.create({
    data: {
      guildId: data.guildId,
      userId: data.userId,
      moderatorId: data.moderatorId,
      action: data.action,
      reason: data.reason
    }
  });
}
