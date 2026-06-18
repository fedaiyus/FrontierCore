const { spawnSync } = require("node:child_process");

const DEFAULT_EMS_CHANNEL_ID = "1516962618294800416";
const valueFlags = new Set(["--edit", "--guild", "--channel", "--language", "--lang", "--role", "--type"]);

function hasChannelArgument(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--channel") {
      return true;
    }

    if (valueFlags.has(value)) {
      index += 1;
      continue;
    }

    if (value && !value.startsWith("--")) {
      return true;
    }
  }

  return false;
}

const originalArgs = process.argv.slice(2);
const nextArgs = ["--type", "ems", ...originalArgs];

if (!hasChannelArgument(originalArgs)) {
  nextArgs.unshift(DEFAULT_EMS_CHANNEL_ID);
}

const result = spawnSync(process.execPath, [require.resolve("./post-application-panel.cjs"), ...nextArgs], {
  stdio: "inherit"
});

process.exit(result.status ?? 1);
