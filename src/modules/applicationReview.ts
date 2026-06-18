import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type EmbedBuilder,
  type Guild,
  type GuildMember,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type User
} from "discord.js";
import { BRAND, DISCORD_LIMITS } from "../config/constants";
import { t } from "../i18n";
import { frontierEmbed } from "../utils/embeds";
import { truncate } from "../utils/text";
import {
  FRONTIER_TURKIYE_CHANNELS,
  FRONTIER_TURKIYE_GUILD_ID,
  FRONTIER_TURKIYE_ROLES,
  officialStaffRoleId
} from "../config/frontierOfficial";
import {
  applicationTypeLabelKeys,
  characterApplicationTypes,
  type ApplicationType
} from "./applicationTypes";
import { ensureGuildConfig } from "./guildConfig";

export type ApplicationAnswer = {
  question: string;
  answer: string;
};

export type ApplicationReviewStatus = "pending" | "approved" | "denied";
export type ApplicationReviewVisibility = "anonymous" | "public";

const applicationReviewChannelIds: Partial<Record<string, Partial<Record<ApplicationType, string>>>> = {
  [FRONTIER_TURKIYE_GUILD_ID]: {
    ems: FRONTIER_TURKIYE_CHANNELS.emsReview
  }
};

const fallbackApplicationReviewChannelIds: Partial<Record<ApplicationType, string>> = {
  ems: FRONTIER_TURKIYE_CHANNELS.emsReview
};

const applicationThemeRoleIds: Partial<Record<string, Partial<Record<ApplicationType, string>>>> = {
  [FRONTIER_TURKIYE_GUILD_ID]: {
    ems: FRONTIER_TURKIYE_ROLES.ems
  }
};

const statusColors: Record<ApplicationReviewStatus, number> = {
  pending: BRAND.gold,
  approved: 0x2ecc71,
  denied: 0xe74c3c
};

const statusEmoji: Record<ApplicationReviewStatus, string> = {
  pending: "🟡",
  approved: "✅",
  denied: "⛔"
};

export function resolveApplicationReviewChannelId(
  guildId: string,
  type: ApplicationType,
  fallbackLogChannelId?: string | null
): string | null {
  return applicationReviewChannelIds[guildId]?.[type] ?? fallbackApplicationReviewChannelIds[type] ?? fallbackLogChannelId ?? null;
}

export function resolveApplicantName(
  type: ApplicationType,
  answers: ApplicationAnswer[],
  fallbackName: string
): string {
  const characterName = characterApplicationTypes.includes(type) ? answers[0]?.answer.trim() : "";
  return truncate(characterName || fallbackName, 90);
}

export function parseApplicationAnswers(value: string): ApplicationAnswer[] {
  try {
    const parsed = JSON.parse(value) as ApplicationAnswer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isApplicationReviewStatus(value: string): value is Exclude<ApplicationReviewStatus, "pending"> {
  return value === "approved" || value === "denied";
}

export function isApplicationReviewVisibility(value: string): value is ApplicationReviewVisibility {
  return value === "anonymous" || value === "public";
}

export async function applicationReviewActionRow(
  guildId: string,
  applicationId: number
): Promise<ActionRowBuilder<ButtonBuilder>> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`application:review:approved:public:${applicationId}`)
      .setLabel(await t(guildId, "application.approveButton"))
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`application:review:denied:anonymous:${applicationId}`)
      .setLabel(await t(guildId, "application.denyAnonymousButton"))
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`application:review:denied:public:${applicationId}`)
      .setLabel(await t(guildId, "application.denyPublicButton"))
      .setStyle(ButtonStyle.Secondary)
  );
}

export async function applicationReviewModal(
  guildId: string,
  status: Exclude<ApplicationReviewStatus, "pending">,
  visibility: ApplicationReviewVisibility,
  applicationId: number
): Promise<ModalBuilder> {
  const titleKey =
    status === "approved"
      ? "application.approveModalTitle"
      : visibility === "public"
        ? "application.denyPublicModalTitle"
        : "application.denyModalTitle";

  const noteInput = new TextInputBuilder()
    .setCustomId("note")
    .setLabel(await t(guildId, "application.reviewNoteLabel"))
    .setPlaceholder(await t(guildId, "application.reviewNotePlaceholder"))
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(1000);

  return new ModalBuilder()
    .setCustomId(`application:reviewSubmit:${status}:${visibility}:${applicationId}`)
    .setTitle(await t(guildId, titleKey))
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));
}

async function resolveReviewColor(
  guild: Guild,
  member: GuildMember | null,
  type: ApplicationType,
  status: ApplicationReviewStatus
): Promise<number> {
  if (status !== "pending") {
    return statusColors[status];
  }

  const config = await ensureGuildConfig(guild).catch(() => null);
  const roleId = applicationThemeRoleIds[guild.id]?.[type]
    ?? officialStaffRoleId(guild.id, config?.staffRoleId ?? config?.supportRoleId ?? config?.adminRoleId);
  const configuredRole = roleId ? guild.roles.cache.get(roleId) ?? await guild.roles.fetch(roleId).catch(() => null) : null;
  const configuredRoleColor = configuredRole?.color ?? 0;
  const memberRoleColor = member?.roles.color?.color ?? member?.displayColor ?? 0;

  return configuredRoleColor || memberRoleColor || statusColors.pending;
}

function discordTimestamp(date: Date, style: "F" | "R" = "F"): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

function quoteResponse(value: string): string {
  const cleaned = truncate(value.trim() || "-", 950);
  return `> ${cleaned.replace(/\r?\n/g, "\n> ")}`;
}

async function statusLabel(guildId: string, status: ApplicationReviewStatus): Promise<string> {
  if (status === "approved") {
    return t(guildId, "application.statusApprovedDisplay");
  }

  if (status === "denied") {
    return t(guildId, "application.statusDeniedDisplay");
  }

  return t(guildId, "application.statusPendingDisplay");
}

type ApplicationReviewEmbedInput = {
  guild: Guild;
  applicationId: number;
  type: ApplicationType;
  answers: ApplicationAnswer[];
  applicantUser: User;
  applicantMember: GuildMember | null;
  status: ApplicationReviewStatus;
  createdAt: Date;
  reviewedAt?: Date | null;
  reviewer?: User | null;
  reviewerVisible?: boolean;
  responseNote?: string;
};

export async function buildApplicationReviewEmbed(input: ApplicationReviewEmbedInput): Promise<EmbedBuilder> {
  const guildId = input.guild.id;
  const typeLabel = await t(guildId, applicationTypeLabelKeys[input.type]);
  const applicantName = resolveApplicantName(
    input.type,
    input.answers,
    input.applicantMember?.displayName ?? input.applicantUser.globalName ?? input.applicantUser.username
  );
  const label = await statusLabel(guildId, input.status);
  const themeColor = await resolveReviewColor(input.guild, input.applicantMember, input.type, input.status);
  const accountCreated = discordTimestamp(input.applicantUser.createdAt);
  const joinedServer = input.applicantMember?.joinedAt
    ? discordTimestamp(input.applicantMember.joinedAt)
    : await t(guildId, "common.unknown");
  const reviewedLine = input.reviewedAt
    ? `-# ${await t(guildId, "application.reviewedAt")}: ${discordTimestamp(input.reviewedAt)}`
    : undefined;
  const reviewerLine = input.reviewer
    ? `-# ${await t(guildId, "application.reviewer")}: ${
        input.reviewerVisible ? `${input.reviewer.toString()} (${input.reviewer.tag})` : await t(guildId, "application.reviewerAnonymous")
      }`
    : undefined;

  const description = [
    `# ${statusEmoji[input.status]} ${label}`,
    `## ${typeLabel} • ${applicantName}`,
    `-# ${await t(guildId, "application.submittedAt")}: ${discordTimestamp(input.createdAt)}`,
    reviewedLine,
    reviewerLine
  ].filter(Boolean).join("\n");

  const embed = frontierEmbed(themeColor)
    .setTitle(await t(guildId, "application.reviewCardTitle", { type: typeLabel, applicant: applicantName }))
    .setDescription(truncate(description, DISCORD_LIMITS.embedDescription))
    .setThumbnail(input.applicantUser.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: `👤 ${await t(guildId, "application.applicantInfo")}`,
        value: [
          `**${await t(guildId, "application.applicant")}:** ${input.applicantUser.toString()}`,
          `**${await t(guildId, "application.discordTag")}:** \`${input.applicantUser.tag}\``,
          `**${await t(guildId, "application.discordId")}:** \`${input.applicantUser.id}\``,
          `**${await t(guildId, "application.profile")}:** [${await t(
            guildId,
            "application.openProfile"
          )}](https://discord.com/users/${input.applicantUser.id})`,
          `**${await t(guildId, "application.accountCreated")}:** ${accountCreated}`,
          `**${await t(guildId, "application.joinedServer")}:** ${joinedServer}`,
          `-# ${await t(guildId, "application.contactHint")}`
        ].join("\n"),
        inline: false
      },
      ...input.answers.map((answer) => ({
        name: `📝 ${answer.question}`,
        value: quoteResponse(answer.answer),
        inline: false
      }))
    );

  if (input.responseNote?.trim()) {
    embed.addFields({
      name: `💬 ${await t(guildId, "application.responseToApplicant")}`,
      value: quoteResponse(input.responseNote),
      inline: false
    });
  }

  return embed;
}

type ApplicationDecisionDmInput = ApplicationReviewEmbedInput & {
  status: Exclude<ApplicationReviewStatus, "pending">;
};

export async function buildApplicationDecisionDmEmbed(input: ApplicationDecisionDmInput): Promise<EmbedBuilder> {
  const guildId = input.guild.id;
  const typeLabel = await t(guildId, applicationTypeLabelKeys[input.type]);
  const label = await statusLabel(guildId, input.status);
  const reviewerText =
    input.status === "denied" && !input.reviewerVisible
      ? await t(guildId, "application.reviewerAnonymous")
      : input.reviewer
        ? `${input.reviewer.tag}`
        : await t(guildId, "common.unknown");

  const description = [
    `# ${statusEmoji[input.status]} ${label}`,
    `## ${typeLabel}`,
    `-# ${input.guild.name} • ${await t(guildId, "application.submittedAt")}: ${discordTimestamp(input.createdAt)}`,
    "",
    input.status === "approved"
      ? await t(guildId, "application.dmApprovedBody", { type: typeLabel })
      : await t(guildId, "application.dmDeniedBody", { type: typeLabel }),
    "",
    `### 💬 ${await t(guildId, "application.responseToApplicant")}`,
    input.responseNote?.trim() ? quoteResponse(input.responseNote) : `-# ${await t(guildId, "application.noResponseNote")}`,
    "",
    `-# ${await t(guildId, "application.reviewer")}: ${reviewerText}`
  ].join("\n");

  return frontierEmbed(statusColors[input.status])
    .setTitle(await t(guildId, "application.dmTitle", { type: typeLabel }))
    .setDescription(truncate(description, DISCORD_LIMITS.embedDescription));
}
