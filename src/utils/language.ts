export function stripDiacritics(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function looksTurkish(value: string): boolean {
  const normalized = stripDiacritics(value).toLowerCase();
  return /\bturkiye\b|\bturkish\b|\bturk\b/.test(normalized);
}
