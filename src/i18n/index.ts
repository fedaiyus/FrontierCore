import fs from "node:fs";
import path from "node:path";
import { prisma } from "../database/prisma";
import { looksTurkish } from "../utils/language";

export type Language = "en" | "tr";
type LocaleTree = Record<string, unknown>;
type Vars = Record<string, string | number | boolean | null | undefined>;

const fallbackLanguage: Language = "en";
const supportedLanguages = new Set<Language>(["en", "tr"]);
const locales = new Map<Language, LocaleTree>();

function normalizeLanguage(language?: string | null): Language {
  return supportedLanguages.has(language as Language) ? (language as Language) : fallbackLanguage;
}

function loadLocale(language: Language): LocaleTree {
  const cached = locales.get(language);

  if (cached) {
    return cached;
  }

  const file = path.join(__dirname, "locales", `${language}.json`);
  const locale = JSON.parse(fs.readFileSync(file, "utf8")) as LocaleTree;
  locales.set(language, locale);
  return locale;
}

function resolveKey(locale: LocaleTree, key: string): string | undefined {
  let current: unknown = locale;

  for (const part of key.split(".")) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(value: string, vars: Vars): string {
  return value.replace(/\{(\w+)\}/g, (match, key: string) => {
    const replacement = vars[key];
    return replacement === undefined || replacement === null ? match : String(replacement);
  });
}

export function defaultLanguageFromGuildName(name: string): Language {
  return looksTurkish(name) ? "tr" : "en";
}

export async function getGuildLanguage(guildId?: string | null): Promise<Language> {
  if (!guildId) {
    return fallbackLanguage;
  }

  const config = await prisma.guildConfig.findUnique({
    where: { guildId },
    select: { language: true }
  });

  return normalizeLanguage(config?.language);
}

export function translate(language: Language, key: string, vars: Vars = {}): string {
  const locale = loadLocale(language);
  const fallback = loadLocale(fallbackLanguage);
  const value = resolveKey(locale, key) ?? resolveKey(fallback, key) ?? key;
  return interpolate(value, vars);
}

export async function t(guildId: string | null | undefined, key: string, vars: Vars = {}): Promise<string> {
  const language = await getGuildLanguage(guildId);
  return translate(language, key, vars);
}
