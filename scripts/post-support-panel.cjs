const {
  fetchRoleColor,
  readCommonArgs,
  requireBotToken,
  resolveLanguage,
  resolveStaffRoleId,
  sendDiscordRequest
} = require("./panel-utils.cjs");

const DEFAULT_GUILD_ID = "1516339966710513685";
const DEFAULT_CHANNEL_ID = "1516339970384859262";

const copy = {
  en: {
    header: "# 🎫 Frontier Support",
    subheader: "## Official Support Desk",
    intro: "-# Select the closest support path below. Frontier staff will handle your request in a private ticket.",
    available: "### Available Support",
    general: "**💬 General Support:** questions, account help, or general server support.",
    rank: "**🎖️ Rank Request:** Discord rank or role review.",
    report: "**🛡️ Player Report:** report player conduct with evidence.",
    bug: "**🛠️ Bug Report:** report bot, server, or gameplay issues.",
    donation: "**💛 Donation Support:** donation questions and purchase help.",
    warning: "-# Abuse of support tickets may be logged and reviewed by staff.",
    labels: {
      general: "General Support",
      rank: "Rank Request",
      report: "Player Report",
      bug: "Bug Report",
      donation: "Donation Support"
    }
  },
  tr: {
    header: "# 🎫 Frontier Destek",
    subheader: "## Resmi Destek Masası",
    intro: "-# Sana en yakın destek türünü seç. Frontier yetkilileri talebini özel bir ticket içinde inceleyecek.",
    available: "### Destek Türleri",
    general: "**💬 Genel Destek:** soru, hesap yardımı veya genel sunucu desteği.",
    rank: "**🎖️ Rütbe Talebi:** Discord rütbe veya rol incelemesi.",
    report: "**🛡️ Oyuncu Şikayeti:** kanıtla birlikte oyuncu davranışı bildirimi.",
    bug: "**🛠️ Hata Bildirimi:** bot, sunucu veya oyun sistemi sorunları.",
    donation: "**💛 Bağış Desteği:** bağış ve satın alma yardımı.",
    warning: "-# Destek ticketlarını kötüye kullanmak loglanabilir ve yetkililer tarafından incelenebilir.",
    labels: {
      general: "Genel Destek",
      rank: "Rütbe Talebi",
      report: "Oyuncu Şikayeti",
      bug: "Hata Bildirimi",
      donation: "Bağış Desteği"
    }
  }
};

function buildPanelPayload(color, language) {
  const text = copy[language] ?? copy.en;

  return {
    embeds: [
      {
        description: [
          text.header,
          text.subheader,
          text.intro,
          "",
          text.available,
          `- ${text.general}`,
          `- ${text.rank}`,
          `- ${text.report}`,
          `- ${text.bug}`,
          `- ${text.donation}`,
          "",
          text.warning
        ].join("\n"),
        color,
        footer: { text: "Frontier Networks" }
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            emoji: { name: "💬" },
            label: text.labels.general,
            custom_id: "ticket:create:general"
          },
          {
            type: 2,
            style: 2,
            emoji: { name: "🎖️" },
            label: text.labels.rank,
            custom_id: "ticket:create:rank"
          },
          {
            type: 2,
            style: 4,
            emoji: { name: "🛡️" },
            label: text.labels.report,
            custom_id: "ticket:create:report"
          },
          {
            type: 2,
            style: 2,
            emoji: { name: "🛠️" },
            label: text.labels.bug,
            custom_id: "ticket:create:bug"
          },
          {
            type: 2,
            style: 3,
            emoji: { name: "💛" },
            label: text.labels.donation,
            custom_id: "ticket:create:donation"
          }
        ]
      }
    ]
  };
}

async function main() {
  const token = requireBotToken();
  const args = readCommonArgs(process.argv.slice(2), {
    channelId: DEFAULT_CHANNEL_ID,
    guildId: DEFAULT_GUILD_ID
  });
  const language = await resolveLanguage(args.guildId, args.language);
  const roleId = await resolveStaffRoleId(args.guildId, args.roleId);
  const color = await fetchRoleColor(token, args.guildId, roleId);
  const body = await sendDiscordRequest(token, args.channelId, buildPanelPayload(color, language), args.messageId);

  if (args.messageId) {
    console.log(`Support panel edited in channel ${args.channelId} using ${language}.`);
    console.log(`Message ID: ${args.messageId}`);
  } else {
    console.log(`Support panel posted to channel ${args.channelId} using ${language}.`);
    console.log(`Message ID: ${body.id}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
