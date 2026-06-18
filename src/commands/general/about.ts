import { AttachmentBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getFrontierAsset, resolveGuildBrandAsset } from "../../config/brandAssets";
import { BRAND } from "../../config/constants";
import { ensureGuildConfig } from "../../modules/guildConfig";
import type { BotCommand } from "../../types/Command";
import { frontierEmbed } from "../../utils/embeds";
import { t } from "../../i18n";

export const aboutCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("about")
    .setDescription("Show Frontier Core branding and network plans.")
    .setDescriptionLocalizations({ tr: "Frontier Core marka ve ağ planlarını gösterir." }),
  async execute(interaction) {
    const config = interaction.guild ? await ensureGuildConfig(interaction.guild) : null;
    const branchAsset = resolveGuildBrandAsset(`${interaction.guild?.name ?? ""} ${config?.branchName ?? ""}`);
    const networkAsset = getFrontierAsset("frontiernetworks");
    const branchLogo = new AttachmentBuilder(branchAsset.path, { name: branchAsset.fileName });
    const networkLogo = new AttachmentBuilder(networkAsset.path, { name: networkAsset.fileName });
    const files = [];

    if (!BRAND.logoUrl) {
      files.push(branchLogo);
    }

    if (!BRAND.coverUrl && networkAsset.fileName !== branchAsset.fileName) {
      files.push(networkLogo);
    }

    const embed = frontierEmbed()
      .setTitle(await t(interaction.guildId, "about.title"))
      .setDescription(await t(interaction.guildId, "about.description"))
      .setThumbnail(BRAND.logoUrl ?? branchAsset.attachmentUrl)
      .addFields(
        {
          name: await t(interaction.guildId, "about.regions"),
          value: await t(interaction.guildId, "about.regionsValue"),
          inline: false
        },
        {
          name: await t(interaction.guildId, "about.platforms"),
          value: await t(interaction.guildId, "about.platformsValue"),
          inline: false
        },
        {
          name: await t(interaction.guildId, "about.commands"),
          value: await t(interaction.guildId, "about.commandsValue"),
          inline: false
        }
      );

    if (config?.branchName) {
      embed.addFields({
        name: await t(interaction.guildId, "about.branch"),
        value: config.branchName,
        inline: true
      });
    }

    if (BRAND.coverUrl) {
      embed.setImage(BRAND.coverUrl);
    } else {
      embed.setImage(networkAsset.attachmentUrl);
    }

    await interaction.reply({
      embeds: [embed],
      files,
      flags: MessageFlags.Ephemeral
    });
  }
};
