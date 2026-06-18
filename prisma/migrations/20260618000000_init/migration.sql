-- CreateTable
CREATE TABLE "GuildConfig" (
    "guildId" TEXT NOT NULL PRIMARY KEY,
    "guildName" TEXT NOT NULL,
    "branchName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "logChannelId" TEXT,
    "welcomeChannelId" TEXT,
    "ticketCategoryId" TEXT,
    "applicationCategoryId" TEXT,
    "privateVoiceCategoryId" TEXT,
    "supportRoleId" TEXT,
    "staffRoleId" TEXT,
    "adminRoleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "claimedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "answers" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME
);

-- CreateTable
CREATE TABLE "RankRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedRoleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PrivateVoiceRoom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_channelId_key" ON "Ticket"("channelId");

-- CreateIndex
CREATE INDEX "Ticket_guildId_idx" ON "Ticket"("guildId");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Application_guildId_idx" ON "Application"("guildId");

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "RankRequest_guildId_idx" ON "RankRequest"("guildId");

-- CreateIndex
CREATE INDEX "RankRequest_userId_idx" ON "RankRequest"("userId");

-- CreateIndex
CREATE INDEX "RankRequest_status_idx" ON "RankRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateVoiceRoom_channelId_key" ON "PrivateVoiceRoom"("channelId");

-- CreateIndex
CREATE INDEX "PrivateVoiceRoom_guildId_idx" ON "PrivateVoiceRoom"("guildId");

-- CreateIndex
CREATE INDEX "PrivateVoiceRoom_ownerId_idx" ON "PrivateVoiceRoom"("ownerId");

-- CreateIndex
CREATE INDEX "ModerationLog_guildId_idx" ON "ModerationLog"("guildId");

-- CreateIndex
CREATE INDEX "ModerationLog_userId_idx" ON "ModerationLog"("userId");

-- CreateIndex
CREATE INDEX "ModerationLog_moderatorId_idx" ON "ModerationLog"("moderatorId");

-- CreateIndex
CREATE INDEX "ModerationLog_action_idx" ON "ModerationLog"("action");
