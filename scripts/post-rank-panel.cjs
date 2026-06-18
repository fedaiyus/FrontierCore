const {
  fetchRoleColor,
  readCommonArgs,
  requireBotToken,
  resolveLanguage,
  resolveStaffRoleId,
  sendDiscordRequest
} = require("./panel-utils.cjs");

const DEFAULT_GUILD_ID = "1516339966710513685";

const copy = {
  en: {
    header: "# 🎖️ Rank Requests",
    subheader: "## Discord Role Review",
    intro: "-# Use this channel as the official starting point for Discord role and rank requests.",
    how: "### How To Submit",
    steps: [
      "Run `/rank-request` in this server.",
      "Choose the role you are requesting.",
      "Write a clear reason so staff can review it properly."
    ],
    review: "### Staff Review",
    reviewBody: "Frontier staff will review the request, approve or deny it, and apply the role when approved.",
    note: "-# Use one request per role. Low-effort or duplicate requests may be denied.",
    button: "Use /rank-request"
  },
  tr: {
    header: "# 🎖️ Rütbe Talepleri",
    subheader: "## Discord Rol İncelemesi",
    intro: "-# Discord rol ve rütbe talepleri için resmi başlangıç paneli.",
    how: "### Nasıl Gönderilir",
    steps: [
      "Bu sunucuda `/rank-request` komutunu kullan.",
      "Talep ettiğin rolü seç.",
      "Yetkililerin inceleyebilmesi için net bir sebep yaz."
    ],
    review: "### Yetkili İncelemesi",
    reviewBody: "Frontier yetkilileri talebi inceler, kabul veya red kararı verir ve kabul edilirse rolü uygular.",
    note: "-# Her rol için tek talep aç. Özverisiz veya tekrar eden talepler reddedilebilir.",
    button: "/rank-request kullan"
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
          text.how,
          ...text.steps.map((step, index) => `${index + 1}. ${step}`),
          "",
          text.review,
          text.reviewBody,
          "",
          text.note
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
            style: 2,
            emoji: { name: "🎖️" },
            label: text.button,
            custom_id: "rank:panel-disabled",
            disabled: true
          }
        ]
      }
    ]
  };
}

async function main() {
  const token = requireBotToken();
  const args = readCommonArgs(process.argv.slice(2), {
    guildId: DEFAULT_GUILD_ID
  });

  if (!args.channelId) {
    throw new Error("Rank panel channel ID is required. Pass it as the first argument or with --channel.");
  }

  const language = await resolveLanguage(args.guildId, args.language);
  const roleId = await resolveStaffRoleId(args.guildId, args.roleId);
  const color = await fetchRoleColor(token, args.guildId, roleId);
  const body = await sendDiscordRequest(token, args.channelId, buildPanelPayload(color, language), args.messageId);

  if (args.messageId) {
    console.log(`Rank panel edited in channel ${args.channelId} using ${language}.`);
    console.log(`Message ID: ${args.messageId}`);
  } else {
    console.log(`Rank panel posted to channel ${args.channelId} using ${language}.`);
    console.log(`Message ID: ${body.id}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
