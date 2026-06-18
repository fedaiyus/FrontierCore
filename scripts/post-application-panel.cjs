const {
  fetchRoleColor,
  readCommonArgs,
  requireBotToken,
  resolveLanguage,
  resolveStaffRoleId,
  sendDiscordRequest
} = require("./panel-utils.cjs");

const DEFAULT_GUILD_ID = "1516339966710513685";
const EMS_ROLE_ID = "1516960457674592416";

const validTypes = new Set(["whitelist", "staff", "lspd", "bcso", "ems"]);

const copy = {
  en: {
    whitelist: {
      emoji: "✅",
      header: "# ✅ Whitelist Applications",
      subheader: "## Frontier Roleplay Access",
      intro: "-# Official application panel for whitelist access.",
      asks: [
        "Character name and basic roleplay background",
        "Previous experience",
        "Motivation for joining",
        "Rule understanding",
        "Optional notes for staff"
      ],
      process: "Start the application below, complete the modal, and wait for staff review.",
      note: "-# Clear, serious answers help staff review your request faster.",
      button: "Start Whitelist Application"
    },
    staff: {
      emoji: "🛡️",
      header: "# 🛡️ Staff Applications",
      subheader: "## Frontier Staff Team",
      intro: "-# Official application panel for staff candidates.",
      asks: [
        "Availability and timezone",
        "Previous staff or moderation experience",
        "Motivation for joining staff",
        "Scenario response",
        "Strengths you bring to the team"
      ],
      process: "Start the application below, complete the modal, and wait for leadership review.",
      note: "-# Staff applicants should show maturity, consistency, and good judgment.",
      button: "Start Staff Application"
    },
    lspd: {
      emoji: "📋",
      header: "# 📋 LSPD Applications",
      subheader: "## Los Santos Police Department",
      intro: "-# Official Frontier FiveM law enforcement application panel.",
      asks: [
        "Character name",
        "Department interest",
        "Previous law enforcement or RP experience",
        "Scenario response",
        "Availability"
      ],
      process: "Start the application below, complete the modal, and staff will review it privately.",
      note: "-# Realistic, disciplined, evidence-driven police RP is expected.",
      button: "Start LSPD Application"
    },
    bcso: {
      emoji: "⭐",
      header: "# ⭐ BCSO Applications",
      subheader: "## Blaine County Sheriff's Office",
      intro: "-# Official Frontier FiveM county law enforcement application panel.",
      asks: [
        "Character name",
        "Department interest",
        "Previous law enforcement or RP experience",
        "Scenario response",
        "Availability"
      ],
      process: "Start the application below, complete the modal, and staff will review it privately.",
      note: "-# Strong scene discipline and patient roleplay matter here.",
      button: "Start BCSO Application"
    },
    ems: {
      emoji: "🚑",
      header: "# 🚑 EMS Applications",
      subheader: "## Frontier Medical Services",
      intro: "-# Official application panel for EMS candidates.",
      asks: [
        "Character name and Discord contact information",
        "Timezone, activity, and real age",
        "Previous EMS or RP experience",
        "Understanding of EMS responsibilities",
        "Preferred medical roleplay style",
        "Why you should be accepted"
      ],
      process: "Start the application below, complete both modal steps, and staff will send the result by DM.",
      note: "-# Serious, calm, high-quality medical RP is expected.",
      button: "Start EMS Application"
    }
  },
  tr: {
    whitelist: {
      emoji: "✅",
      header: "# ✅ Whitelist Başvuruları",
      subheader: "## Frontier Roleplay Erişimi",
      intro: "-# Whitelist erişimi için resmi başvuru paneli.",
      asks: [
        "Karakter adı ve temel roleplay geçmişi",
        "Önceki deneyim",
        "Katılma motivasyonu",
        "Kural anlayışı",
        "Yetkililer için isteğe bağlı notlar"
      ],
      process: "Aşağıdaki butonla başvuruyu başlat, modalı doldur ve yetkili incelemesini bekle.",
      note: "-# Net ve ciddi cevaplar incelemeyi hızlandırır.",
      button: "Whitelist Başvurusuna Başla"
    },
    staff: {
      emoji: "🛡️",
      header: "# 🛡️ Yetkili Başvuruları",
      subheader: "## Frontier Yetkili Ekibi",
      intro: "-# Yetkili adayları için resmi başvuru paneli.",
      asks: [
        "Aktiflik ve saat dilimi",
        "Önceki yetkili veya moderasyon deneyimi",
        "Yetkili ekibine katılma motivasyonu",
        "Senaryo cevabı",
        "Ekibe katacağın güçlü yönler"
      ],
      process: "Aşağıdaki butonla başvuruyu başlat, modalı doldur ve yönetim incelemesini bekle.",
      note: "-# Yetkili adaylarından olgunluk, düzen ve iyi karar verme beklenir.",
      button: "Yetkili Başvurusuna Başla"
    },
    lspd: {
      emoji: "📋",
      header: "# 📋 LSPD Başvuruları",
      subheader: "## Los Santos Police Department",
      intro: "-# Frontier FiveM polis roleplayi için resmi başvuru paneli.",
      asks: [
        "Karakter adı",
        "Departman ilgisi",
        "Önceki polis veya RP deneyimi",
        "Senaryo cevabı",
        "Aktiflik"
      ],
      process: "Aşağıdaki butonla başvuruyu başlat, modalı doldur ve yetkili incelemesini bekle.",
      note: "-# Gerçekçi, disiplinli ve kanıta dayalı polis roleplayi beklenir.",
      button: "LSPD Başvurusuna Başla"
    },
    bcso: {
      emoji: "⭐",
      header: "# ⭐ BCSO Başvuruları",
      subheader: "## Blaine County Sheriff's Office",
      intro: "-# Frontier FiveM county law enforcement başvuru paneli.",
      asks: [
        "Karakter adı",
        "Departman ilgisi",
        "Önceki polis veya RP deneyimi",
        "Senaryo cevabı",
        "Aktiflik"
      ],
      process: "Aşağıdaki butonla başvuruyu başlat, modalı doldur ve yetkili incelemesini bekle.",
      note: "-# Sahne disiplini ve sabırlı roleplay burada çok önemlidir.",
      button: "BCSO Başvurusuna Başla"
    },
    ems: {
      emoji: "🚑",
      header: "# 🚑 EMS Başvuruları",
      subheader: "## Frontier Medical Services",
      intro: "-# EMS ekibine katılmak isteyen adaylar için resmi başvuru paneli.",
      asks: [
        "Karakter adı ve Discord iletişim bilgileri",
        "Saat dilimi, aktiflik ve gerçek yaş",
        "Önceki EMS veya RP deneyimi",
        "EMS sorumlulukları hakkındaki anlayışın",
        "Yapmak istediğin medikal roleplay tarzı",
        "Neden kabul edilmen gerektiği"
      ],
      process: "Aşağıdaki butonla başvuruyu başlat, iki modal adımını doldur ve sonucu DM üzerinden bekle.",
      note: "-# Ciddi, sakin ve kaliteli medikal roleplay beklenir.",
      button: "EMS Başvurusuna Başla"
    }
  }
};

function readArgs(argv) {
  const args = readCommonArgs(argv, { guildId: DEFAULT_GUILD_ID });
  args.type = "lspd";

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--type") {
      args.type = argv[index + 1] ?? args.type;
      index += 1;
    }
  }

  if (!validTypes.has(args.type)) {
    throw new Error(`Unknown application type: ${args.type}`);
  }

  return args;
}

function buildPanelPayload(color, language, type) {
  const text = (copy[language] ?? copy.en)[type] ?? copy.en.lspd;
  const detailsHeader = language === "tr" ? "### 📋 Başvuru İçeriği" : "### 📋 Application Details";
  const processHeader = language === "tr" ? "### 🧭 Süreç" : "### 🧭 Process";

  return {
    embeds: [
      {
        description: [
          text.header,
          text.subheader,
          text.intro,
          "",
          detailsHeader,
          ...text.asks.map((item) => `- **${item}**`),
          "",
          processHeader,
          text.process,
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
            style: type === "staff" ? 1 : 3,
            emoji: { name: text.emoji },
            label: text.button,
            custom_id: `application:start:${type}`
          }
        ]
      }
    ]
  };
}

async function main() {
  const token = requireBotToken();
  const args = readArgs(process.argv.slice(2));

  if (!args.channelId) {
    throw new Error("Application panel channel ID is required. Pass it as the first argument or with --channel.");
  }

  const language = await resolveLanguage(args.guildId, args.language);
  const roleId = args.roleId ?? (args.type === "ems" ? EMS_ROLE_ID : await resolveStaffRoleId(args.guildId));
  const color = await fetchRoleColor(token, args.guildId, roleId);
  const body = await sendDiscordRequest(
    token,
    args.channelId,
    buildPanelPayload(color, language, args.type),
    args.messageId
  );

  if (args.messageId) {
    console.log(`${args.type.toUpperCase()} panel edited in channel ${args.channelId} using ${language}.`);
    console.log(`Message ID: ${args.messageId}`);
  } else {
    console.log(`${args.type.toUpperCase()} panel posted to channel ${args.channelId} using ${language}.`);
    console.log(`Message ID: ${body.id}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
