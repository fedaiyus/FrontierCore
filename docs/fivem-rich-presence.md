# FiveM Rich Presence Plan

Discord Rich Presence art assets such as `frontiernetworks`, `frontierfivem`, `frontiertr`, and `frontierusa` are for a game/client Rich Presence integration. Discord's Gateway activity docs state that bot users can only set `name`, `state`, `type`, and `url`, so the bot cannot attach `largeImageKey`, `smallImageKey`, party data, or join secrets to its own status.

Use the uploaded Developer Portal assets from a FiveM client/resource integration instead.

## Uploaded Asset Keys

- `frontiernetworks`: main Frontier Networks mark
- `frontierfivem`: FiveM branch
- `frontiertr`: Turkiye branch
- `frontierusa`: USA branch
- `frontierau`: Australia branch
- `frontiergmod`: Garry's Mod branch
- `frontierroblox`: Roblox branch
- `frontierrust`: Rust branch

Matching source files are stored in `assets/logos/`:

- `FrontierNetworks.png`
- `FrontierFiveM.png`
- `FrontierTR.png`
- `FrontierUSA.png`
- `FrontierAU.png`
- `FrontierGMod.png`
- `FrontierRoblox.png`
- `FrontierRust.png`
- `FrontierBot.png`

## Example Presence Shape

```c
static void UpdatePresence()
{
    DiscordRichPresence discordPresence;
    memset(&discordPresence, 0, sizeof(discordPresence));
    discordPresence.state = "Turkiye FiveM";
    discordPresence.details = "Frontier Networks";
    discordPresence.startTimestamp = 1507665886;
    discordPresence.largeImageKey = "frontierfivem";
    discordPresence.largeImageText = "Frontier FiveM";
    discordPresence.smallImageKey = "frontiertr";
    discordPresence.smallImageText = "Frontier Networks Turkiye";
    discordPresence.partyId = "frontier-fivem-session";
    discordPresence.partySize = 1;
    discordPresence.partyMax = 64;
    Discord_UpdatePresence(&discordPresence);
}
```

## Garry's Mod Variant

```c
static void UpdatePresence()
{
    DiscordRichPresence discordPresence;
    memset(&discordPresence, 0, sizeof(discordPresence));
    discordPresence.state = "Garry's Mod Roleplay";
    discordPresence.details = "Frontier Networks";
    discordPresence.startTimestamp = 1507665886;
    discordPresence.largeImageKey = "frontiergmod";
    discordPresence.largeImageText = "Frontier Garry's Mod";
    discordPresence.smallImageKey = "frontiernetworks";
    discordPresence.smallImageText = "Frontier Networks";
    discordPresence.partyId = "frontier-gmod-session";
    discordPresence.partySize = 1;
    discordPresence.partyMax = 128;
    Discord_UpdatePresence(&discordPresence);
}
```

## Generic Network Variant

```c
static void UpdatePresence()
{
    DiscordRichPresence discordPresence;
    memset(&discordPresence, 0, sizeof(discordPresence));
    discordPresence.state = "Playing Solo";
    discordPresence.details = "Competitive";
    discordPresence.startTimestamp = 1507665886;
    discordPresence.largeImageKey = "frontierfivem";
    discordPresence.largeImageText = "Frontier FiveM";
    discordPresence.smallImageKey = "frontiernetworks";
    discordPresence.smallImageText = "Frontier Networks";
    discordPresence.partyId = "ae488379-351d-4a4f-ad32-2b9b01c91657";
    discordPresence.partySize = 1;
    discordPresence.partyMax = 5;
    discordPresence.joinSecret = "MTI4NzM0OjFpMmhuZToxMjMxMjM=";
    Discord_UpdatePresence(&discordPresence);
}
```

Keep Discord's best-practice guidance in mind: short strings, clear state, accurate party data, and clean high-resolution art.
