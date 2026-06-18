import { DISCORD_LIMITS } from "../config/constants";

export function truncate(value: string, max: number = DISCORD_LIMITS.embedFieldValue): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, Math.max(0, max - 3))}...`;
}

export function formatDuration(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts = [
    days ? `${days}d` : undefined,
    hours ? `${hours}h` : undefined,
    minutes ? `${minutes}m` : undefined,
    `${seconds}s`
  ].filter(Boolean);

  return parts.join(" ");
}

export function slugifyChannelName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, DISCORD_LIMITS.channelName);
}
