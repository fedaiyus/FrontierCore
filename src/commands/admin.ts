import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types/Command";
import { ensureGuildConfig, updateGuildConfig } from "../modules/guildConfig";
import { isAdminMember } from "../utils/permissions";
import { frontierEmbed } from "../utils/embeds";
import { t } from "../i18n";

export const adminCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Configure Frontier Core.")
    .setDescriptionLocalizations({ tr: "Frontier Core ayarlarını düzenler." })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("config")
        .setDescription("Update guild configuration.")
        .setDescriptionLocalizations({ tr: "Sunucu ayarlarını günceller." })
        .addStringOption((option) =>
          option
            .setName("branch-name")
            .setDescription("Public Frontier branch name.")
            .setDescriptionLocalizations({ tr: "Görünen Frontier şube adı." })
            .setMaxLength(100)
        )
        .addStringOption((option) =>
          option
            .setName("language")
            .setDescription("Guild language.")
            .setDescriptionLocalizations({ tr: "Sunucu dili." })
            .addChoices({ name: "English", value: "en" }, { name: "Türkçe", value: "tr" })
        )
        .addStringOption((option) =>
          option
            .setName("timezone")
            .setDescription("Guild timezone, for example UTC or Europe/Istanbul.")
            .setDescriptionLocalizations({ tr: "Sunucu saat dilimi, ör. UTC veya Europe/Istanbul." })
            .setMaxLength(64)
        )
        .addChannelOption((option) =>
          option
            .setName("log-channel")
            .setDescription("Logging channel.")
            .setDescriptionLocalizations({ tr: "Log kanalı." })
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
          option
            .setName("welcome-channel")
            .setDescription("Welcome channel.")
            .setDescriptionLocalizations({ tr: "Karşılama kanalı." })
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
          option
            .setName("ticket-category")
            .setDescription("Ticket category.")
            .setDescriptionLocalizations({ tr: "Ticket kategorisi." })
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addChannelOption((option) =>
          option
            .setName("application-category")
            .setDescription("Application category.")
            .setDescriptionLocalizations({ tr: "Başvuru kategorisi." })
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addChannelOption((option) =>
          option
            .setName("private-voice-category")
            .setDescription("Private lounge category.")
            .setDescriptionLocalizations({ tr: "Özel ses odası kategorisi." })
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addRoleOption((option) =>
          option
            .setName("support-role")
            .setDescription("Support role.")
            .setDescriptionLocalizations({ tr: "Destek rolü." })
        )
        .addRoleOption((option) =>
          option
            .setName("staff-role")
            .setDescription("Staff role.")
            .setDescriptionLocalizations({ tr: "Yetkili rolü." })
        )
        .addRoleOption((option) =>
          option
            .setName("admin-role")
            .setDescription("Admin role.")
            .setDescriptionLocalizations({ tr: "Admin rolü." })
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("config-view")
        .setDescription("View guild configuration.")
        .setDescriptionLocalizations({ tr: "Sunucu ayarlarını gösterir." })
    ),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: await t(interaction.guildId, "common.guildOnly"), flags: MessageFlags.Ephemeral });
      return;
    }

    if (!(await isAdminMember(interaction.guild, interaction.user.id))) {
      await interaction.reply({ content: await t(interaction.guild.id, "common.noPermission"), flags: MessageFlags.Ephemeral });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "config") {
      const data = {
        branchName: interaction.options.getString("branch-name") ?? undefined,
        language: interaction.options.getString("language") ?? undefined,
        timezone: interaction.options.getString("timezone") ?? undefined,
        logChannelId: interaction.options.getChannel("log-channel")?.id,
        welcomeChannelId: interaction.options.getChannel("welcome-channel")?.id,
        ticketCategoryId: interaction.options.getChannel("ticket-category")?.id,
        applicationCategoryId: interaction.options.getChannel("application-category")?.id,
        privateVoiceCategoryId: interaction.options.getChannel("private-voice-category")?.id,
        supportRoleId: interaction.options.getRole("support-role")?.id,
        staffRoleId: interaction.options.getRole("staff-role")?.id,
        adminRoleId: interaction.options.getRole("admin-role")?.id
      };

      const provided = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

      if (Object.keys(provided).length === 0) {
        await interaction.reply({ content: await t(interaction.guild.id, "admin.configNoChanges"), flags: MessageFlags.Ephemeral });
        return;
      }

      await updateGuildConfig(interaction.guild, provided);
      await interaction.reply({ content: await t(interaction.guild.id, "admin.configUpdated"), flags: MessageFlags.Ephemeral });
      return;
    }

    const config = await ensureGuildConfig(interaction.guild);
    const none = await t(interaction.guild.id, "common.none");
    const channelValue = (id?: string | null) => (id ? `<#${id}>` : none);
    const roleValue = (id?: string | null) => (id ? `<@&${id}>` : none);

    const embed = frontierEmbed()
      .setTitle(await t(interaction.guild.id, "admin.configViewTitle"))
      .addFields(
        { name: await t(interaction.guild.id, "admin.branchName"), value: config.branchName ?? none, inline: true },
        { name: await t(interaction.guild.id, "admin.language"), value: config.language, inline: true },
        { name: await t(interaction.guild.id, "admin.timezone"), value: config.timezone, inline: true },
        { name: await t(interaction.guild.id, "admin.logChannel"), value: channelValue(config.logChannelId), inline: true },
        {
          name: await t(interaction.guild.id, "admin.welcomeChannel"),
          value: channelValue(config.welcomeChannelId),
          inline: true
        },
        {
          name: await t(interaction.guild.id, "admin.ticketCategory"),
          value: channelValue(config.ticketCategoryId),
          inline: true
        },
        {
          name: await t(interaction.guild.id, "admin.applicationCategory"),
          value: channelValue(config.applicationCategoryId),
          inline: true
        },
        {
          name: await t(interaction.guild.id, "admin.privateVoiceCategory"),
          value: channelValue(config.privateVoiceCategoryId),
          inline: true
        },
        { name: await t(interaction.guild.id, "admin.supportRole"), value: roleValue(config.supportRoleId), inline: true },
        { name: await t(interaction.guild.id, "admin.staffRole"), value: roleValue(config.staffRoleId), inline: true },
        { name: await t(interaction.guild.id, "admin.adminRole"), value: roleValue(config.adminRoleId), inline: true }
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};
