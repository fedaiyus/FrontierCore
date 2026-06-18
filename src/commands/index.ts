import type { BotCommand } from "../types/Command";
import { adminCommand } from "./admin";
import { applyCommand } from "./apply";
import { loungeCommand } from "./lounge";
import { rankRequestCommand } from "./rankRequest";
import { ticketCommand } from "./ticket";
import { aboutCommand } from "./general/about";
import { helpCommand } from "./general/help";
import { pingCommand } from "./general/ping";
import { serverCommand } from "./general/server";
import { statusCommand } from "./general/status";

export const commands: BotCommand[] = [
  aboutCommand,
  helpCommand,
  pingCommand,
  serverCommand,
  statusCommand,
  adminCommand,
  ticketCommand,
  applyCommand,
  rankRequestCommand,
  loungeCommand
];

export const commandMap = new Map(commands.map((command) => [command.data.name, command]));
