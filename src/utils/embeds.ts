import { EmbedBuilder } from "discord.js";
import { BRAND } from "../config/constants";

export function frontierEmbed(color: number = BRAND.gold): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: BRAND.networkName });

  if (BRAND.logoUrl) {
    embed.setThumbnail(BRAND.logoUrl);
  }

  return embed;
}
