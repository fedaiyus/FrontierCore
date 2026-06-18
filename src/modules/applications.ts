import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  type InteractionReplyOptions,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { prisma } from "../database/prisma";
import { ensureGuildConfig } from "./guildConfig";
import { createModerationLog } from "./moderation";
import { isStaffMember } from "../utils/permissions";
import { t } from "../i18n";
import {
  applicationReviewActionRow,
  applicationReviewModal,
  buildApplicationDecisionDmEmbed,
  buildApplicationReviewEmbed,
  isApplicationReviewStatus,
  isApplicationReviewVisibility,
  parseApplicationAnswers,
  resolveApplicationReviewChannelId,
  type ApplicationAnswer
} from "./applicationReview";
import {
  applicationTypeLabelKeys,
  isApplicationType,
  type ApplicationType
} from "./applicationTypes";

type ApplicationQuestion = {
  key: string;
  style?: TextInputStyle;
  required?: boolean;
  maxLength?: number;
};

const applicationQuestions: Record<Exclude<ApplicationType, "ems">, ApplicationQuestion[]> = {
  whitelist: [
    { key: "application.questionCharacter", style: TextInputStyle.Short, maxLength: 100 },
    { key: "application.questionExperience" },
    { key: "application.questionMotivation" },
    { key: "application.questionRules" },
    { key: "application.questionNotes", required: false }
  ],
  staff: [
    { key: "application.questionAvailability", style: TextInputStyle.Short, maxLength: 100 },
    { key: "application.questionExperience" },
    { key: "application.questionMotivation" },
    { key: "application.questionScenario" },
    { key: "application.questionStrengths" }
  ],
  lspd: [
    { key: "application.questionCharacter", style: TextInputStyle.Short, maxLength: 100 },
    { key: "application.questionDepartment" },
    { key: "application.questionExperience" },
    { key: "application.questionScenario" },
    { key: "application.questionAvailability", style: TextInputStyle.Short, maxLength: 100 }
  ],
  bcso: [
    { key: "application.questionCharacter", style: TextInputStyle.Short, maxLength: 100 },
    { key: "application.questionDepartment" },
    { key: "application.questionExperience" },
    { key: "application.questionScenario" },
    { key: "application.questionAvailability", style: TextInputStyle.Short, maxLength: 100 }
  ]
};

const emsApplicationSteps: ApplicationQuestion[][] = [
  [
    { key: "application.emsQuestionCharacter", style: TextInputStyle.Short, maxLength: 100 },
    { key: "application.emsQuestionTimezone", style: TextInputStyle.Short, maxLength: 80 },
    { key: "application.emsQuestionAge", style: TextInputStyle.Short, maxLength: 40 },
    { key: "application.emsQuestionExperience", maxLength: 900 },
    { key: "application.emsQuestionResponsibilities", maxLength: 900 }
  ],
  [
    { key: "application.emsQuestionRpStyle", maxLength: 900 },
    { key: "application.emsQuestionWhyAccepted", maxLength: 900 }
  ]
];

export async function showApplicationModal(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  type: ApplicationType
): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
    return;
  }

  const typeLabel = await t(interaction.guildId, applicationTypeLabelKeys[type]);
  if (type === "ems") {
    await showEmsApplicationModal(interaction, 0);
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`application:submit:${type}`)
    .setTitle(await t(interaction.guildId, "application.modalTitle", { type: typeLabel }));

  const rows = await Promise.all(
    applicationQuestions[type].map(async (questionKey, index) => {
      const input = new TextInputBuilder()
        .setCustomId(`q${index + 1}`)
        .setLabel(await t(interaction.guildId, questionKey.key))
        .setStyle(questionKey.style ?? TextInputStyle.Paragraph)
        .setRequired(questionKey.required ?? true)
        .setMaxLength(questionKey.maxLength ?? 900);

      return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    })
  );

  modal.addComponents(...rows);
  await interaction.showModal(modal);
}

async function showEmsApplicationModal(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  stepIndex: 0 | 1,
  applicationId?: number
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    if (interaction.isRepliable()) {
      await interaction.reply({ content: await t(guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
    }
    return;
  }

  const typeLabel = await t(guildId, "application.typeEms");
  const modal = new ModalBuilder()
    .setCustomId(
      stepIndex === 0 ? "application:submit:ems:1" : `application:submit:ems:2:${applicationId ?? 0}`
    )
    .setTitle(
      await t(guildId, stepIndex === 0 ? "application.emsModalTitleStep1" : "application.emsModalTitleStep2", {
        type: typeLabel
      })
    );

  const rows = await Promise.all(
    emsApplicationSteps[stepIndex].map(async (question, index) => {
      const input = new TextInputBuilder()
        .setCustomId(`q${index + 1}`)
        .setLabel(await t(guildId, question.key))
        .setStyle(question.style ?? TextInputStyle.Paragraph)
        .setRequired(question.required ?? true)
        .setMaxLength(question.maxLength ?? 900);

      return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    })
  );

  modal.addComponents(...rows);
  await interaction.showModal(modal);
}

async function sendApplicationLog(
  interaction: ModalSubmitInteraction,
  application: { id: number; createdAt: Date },
  type: ApplicationType,
  answers: ApplicationAnswer[]
): Promise<void> {
  if (!interaction.guild) {
    return;
  }

  const config = await ensureGuildConfig(interaction.guild);
  const reviewChannelId = resolveApplicationReviewChannelId(interaction.guild.id, type, config.logChannelId);

  if (!reviewChannelId) {
    return;
  }

  const channel = await interaction.guild.channels.fetch(reviewChannelId).catch(() => null);

  if (!channel?.isTextBased()) {
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  const embed = await buildApplicationReviewEmbed({
    guild: interaction.guild,
    applicationId: application.id,
    type,
    answers,
    applicantUser: interaction.user,
    applicantMember: member,
    status: "pending",
    createdAt: application.createdAt
  });

  await channel.send({
    embeds: [embed],
    components: [await applicationReviewActionRow(interaction.guild.id, application.id)]
  }).catch(() => undefined);
}

async function handleApplicationReviewModal(
  interaction: ModalSubmitInteraction,
  rawStatus: string | undefined,
  rawVisibility: string | undefined,
  rawApplicationId: string | undefined
): Promise<boolean> {
  if (
    !interaction.guild ||
    !rawStatus ||
    !rawVisibility ||
    !rawApplicationId ||
    !isApplicationReviewStatus(rawStatus) ||
    !isApplicationReviewVisibility(rawVisibility)
  ) {
    return false;
  }

  if (!(await isStaffMember(interaction.guild, interaction.user.id))) {
    await interaction.reply({ content: await t(interaction.guild.id, "common.staffOnly"), flags: MessageFlags.Ephemeral });
    return true;
  }

  const applicationId = Number(rawApplicationId);

  if (!Number.isInteger(applicationId)) {
    return false;
  }

  const existingApplication = await prisma.application.findUnique({
    where: { id: applicationId }
  });

  if (!existingApplication || !isApplicationType(existingApplication.type)) {
    await interaction.reply({ content: await t(interaction.guild.id, "application.reviewNotFound"), flags: MessageFlags.Ephemeral });
    return true;
  }

  const responseNote = interaction.fields.getTextInputValue("note").trim();
  const reviewedAt = new Date();
  const application = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: rawStatus,
      reviewedBy: interaction.user.id,
      reviewedAt
    }
  });

  const answers = parseApplicationAnswers(application.answers);
  const applicantUser = await interaction.client.users.fetch(application.userId).catch(() => null);
  const applicantMember = await interaction.guild.members.fetch(application.userId).catch(() => null);

  if (!applicantUser) {
    await interaction.reply({ content: await t(interaction.guild.id, "application.applicantMissing"), flags: MessageFlags.Ephemeral });
    return true;
  }

  const reviewerVisible = rawStatus === "approved" || rawVisibility === "public";
  const reviewEmbed = await buildApplicationReviewEmbed({
    guild: interaction.guild,
    applicationId: application.id,
    type: existingApplication.type,
    answers,
    applicantUser,
    applicantMember,
    status: rawStatus,
    createdAt: application.createdAt,
    reviewedAt: application.reviewedAt ?? reviewedAt,
    reviewer: interaction.user,
    reviewerVisible,
    responseNote
  });

  await interaction.message?.edit({ embeds: [reviewEmbed], components: [] }).catch(() => undefined);

  const dmEmbed = await buildApplicationDecisionDmEmbed({
    guild: interaction.guild,
    applicationId: application.id,
    type: existingApplication.type,
    answers,
    applicantUser,
    applicantMember,
    status: rawStatus,
    createdAt: application.createdAt,
    reviewedAt: application.reviewedAt ?? reviewedAt,
    reviewer: interaction.user,
    reviewerVisible,
    responseNote
  });
  const dmSent = await applicantUser.send({ embeds: [dmEmbed] }).then(() => true).catch(() => false);

  await createModerationLog({
    guildId: interaction.guild.id,
    userId: application.userId,
    moderatorId: interaction.user.id,
    action: `application_${rawStatus}`,
    reason: application.type
  });

  await interaction.reply({
    content: await t(interaction.guild.id, dmSent ? "application.reviewedDmSent" : "application.reviewedDmFailed", {
      status: await t(
        interaction.guild.id,
        rawStatus === "approved" ? "application.statusApprovedDisplay" : "application.statusDeniedDisplay"
      )
    }),
    flags: MessageFlags.Ephemeral
  });

  return true;
}

export async function handleApplicationModal(interaction: ModalSubmitInteraction): Promise<boolean> {
  const [, action, rawType, rawStep, rawApplicationId] = interaction.customId.split(":");

  if (action === "reviewSubmit") {
    return handleApplicationReviewModal(interaction, rawType, rawStep, rawApplicationId);
  }

  if (action !== "submit" || !rawType || !isApplicationType(rawType) || !interaction.guild) {
    return false;
  }

  if (rawType === "ems") {
    const step = rawStep === "2" ? 1 : 0;
    const questions = await Promise.all(emsApplicationSteps[step].map((question) => t(interaction.guildId, question.key)));
    const answers = questions.map((question, index) => ({
      question,
      answer: interaction.fields.getTextInputValue(`q${index + 1}`)
    }));

    if (step === 0) {
      const application = await prisma.application.create({
        data: {
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          type: rawType,
          status: "draft",
          answers: JSON.stringify(answers)
        }
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`application:continue:ems:${application.id}`)
          .setLabel(await t(interaction.guild.id, "application.continueButton"))
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        content: await t(interaction.guild.id, "application.emsStepOneSaved"),
        components: [row],
        flags: MessageFlags.Ephemeral
      } satisfies InteractionReplyOptions);

      return true;
    }

    const applicationId = Number(rawApplicationId);
    const draft = Number.isInteger(applicationId)
      ? await prisma.application.findUnique({ where: { id: applicationId } })
      : null;

    if (!draft || draft.userId !== interaction.user.id || draft.guildId !== interaction.guild.id || draft.status !== "draft") {
      await interaction.reply({ content: await t(interaction.guild.id, "application.draftNotFound"), flags: MessageFlags.Ephemeral });
      return true;
    }

    const previousAnswers = JSON.parse(draft.answers) as Array<{ question: string; answer: string }>;
    const completedAnswers = [...previousAnswers, ...answers];

    const application = await prisma.application.update({
      where: { id: draft.id },
      data: {
        status: "pending",
        answers: JSON.stringify(completedAnswers)
      }
    });

    await sendApplicationLog(interaction, application, rawType, completedAnswers);

    await interaction.reply({
      content: await t(interaction.guild.id, "application.submitted", {
        type: await t(interaction.guild.id, applicationTypeLabelKeys[rawType])
      }),
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const standardType = rawType as Exclude<ApplicationType, "ems">;
  const questions = await Promise.all(
    applicationQuestions[standardType].map((question) => t(interaction.guildId, question.key))
  );
  const answers = questions.map((question, index) => ({
    question,
    answer: interaction.fields.getTextInputValue(`q${index + 1}`)
  }));

  const application = await prisma.application.create({
    data: {
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      type: rawType,
      status: "pending",
      answers: JSON.stringify(answers)
    }
  });

  await sendApplicationLog(interaction, application, rawType, answers);

  await interaction.reply({
    content: await t(interaction.guild.id, "application.submitted", {
      type: await t(interaction.guild.id, applicationTypeLabelKeys[rawType])
    }),
    flags: MessageFlags.Ephemeral
  });

  return true;
}

export async function handleApplicationButton(interaction: ButtonInteraction): Promise<boolean> {
  const parts = interaction.customId.split(":");
  const action = parts[1];
  const rawId = parts[2];
  const rawApplicationId = parts[3];

  if (action === "start" && rawId && isApplicationType(rawId)) {
    await showApplicationModal(interaction, rawId);
    return true;
  }

  if (action === "continue" && rawId === "ems" && rawApplicationId && interaction.guild) {
    const applicationId = Number(rawApplicationId);
    const draft = Number.isInteger(applicationId)
      ? await prisma.application.findUnique({ where: { id: applicationId } })
      : null;

    if (!draft || draft.userId !== interaction.user.id || draft.guildId !== interaction.guild.id || draft.status !== "draft") {
      await interaction.reply({ content: await t(interaction.guild.id, "application.draftNotFound"), flags: MessageFlags.Ephemeral });
      return true;
    }

    await showEmsApplicationModal(interaction, 1, draft.id);
    return true;
  }

  if (!interaction.guild) {
    return false;
  }

  if (action === "review") {
    const rawStatus = parts[2];
    const rawVisibility = parts[3];
    const rawReviewApplicationId = parts[4];

    if (
      !rawStatus ||
      !rawVisibility ||
      !rawReviewApplicationId ||
      !isApplicationReviewStatus(rawStatus) ||
      !isApplicationReviewVisibility(rawVisibility)
    ) {
      return false;
    }

    if (!(await isStaffMember(interaction.guild, interaction.user.id))) {
      await interaction.reply({ content: await t(interaction.guild.id, "common.staffOnly"), flags: MessageFlags.Ephemeral });
      return true;
    }

    const applicationId = Number(rawReviewApplicationId);

    if (!Number.isInteger(applicationId)) {
      return false;
    }

    await interaction.showModal(await applicationReviewModal(interaction.guild.id, rawStatus, rawVisibility, applicationId));
    return true;
  }

  if ((action === "approve" || action === "deny") && rawId) {
    if (!(await isStaffMember(interaction.guild, interaction.user.id))) {
      await interaction.reply({ content: await t(interaction.guild.id, "common.staffOnly"), flags: MessageFlags.Ephemeral });
      return true;
    }

    const applicationId = Number(rawId);

    if (!Number.isInteger(applicationId)) {
      return false;
    }

    await interaction.showModal(
      await applicationReviewModal(
        interaction.guild.id,
        action === "approve" ? "approved" : "denied",
        action === "approve" ? "public" : "anonymous",
        applicationId
      )
    );
    return true;
  }

  return false;
}
