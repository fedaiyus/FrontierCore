const fs = require("node:fs");
const path = require("node:path");

const copies = [
  {
    from: path.join(__dirname, "..", "src", "i18n", "locales"),
    to: path.join(__dirname, "..", "dist", "i18n", "locales")
  }
];

for (const copy of copies) {
  if (!fs.existsSync(copy.from)) {
    continue;
  }

  fs.mkdirSync(copy.to, { recursive: true });

  for (const entry of fs.readdirSync(copy.from)) {
    const source = path.join(copy.from, entry);
    const target = path.join(copy.to, entry);

    if (fs.statSync(source).isFile()) {
      fs.copyFileSync(source, target);
    }
  }
}
