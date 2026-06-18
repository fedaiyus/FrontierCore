import path from "node:path";

export type FrontierAssetKey =
  | "frontierau"
  | "frontierbot"
  | "frontierfivem"
  | "frontiergmod"
  | "frontiernetworks"
  | "frontierroblox"
  | "frontierrust"
  | "frontiertr"
  | "frontierusa";

export interface FrontierAsset {
  key: FrontierAssetKey;
  label: string;
  fileName: string;
  path: string;
  attachmentUrl: string;
}

const assetFiles: Record<FrontierAssetKey, { label: string; fileName: string }> = {
  frontierau: { label: "Frontier Australia", fileName: "FrontierAU.png" },
  frontierbot: { label: "Frontier Core", fileName: "FrontierBot.png" },
  frontierfivem: { label: "Frontier FiveM", fileName: "FrontierFiveM.png" },
  frontiergmod: { label: "Frontier Garry's Mod", fileName: "FrontierGMod.png" },
  frontiernetworks: { label: "Frontier Networks", fileName: "FrontierNetworks.png" },
  frontierroblox: { label: "Frontier Roblox", fileName: "FrontierRoblox.png" },
  frontierrust: { label: "Frontier Rust", fileName: "FrontierRust.png" },
  frontiertr: { label: "Frontier Turkiye", fileName: "FrontierTR.png" },
  frontierusa: { label: "Frontier USA", fileName: "FrontierUSA.png" }
};

function buildAsset(key: FrontierAssetKey): FrontierAsset {
  const asset = assetFiles[key];
  const filePath = path.join(process.cwd(), "assets", "logos", asset.fileName);

  return {
    key,
    label: asset.label,
    fileName: asset.fileName,
    path: filePath,
    attachmentUrl: `attachment://${asset.fileName}`
  };
}

export function getFrontierAsset(key: FrontierAssetKey): FrontierAsset {
  return buildAsset(key);
}

export function getAllFrontierAssets(): FrontierAsset[] {
  return (Object.keys(assetFiles) as FrontierAssetKey[]).map(getFrontierAsset);
}

export function resolveGuildBrandAsset(input: string | null | undefined): FrontierAsset {
  const value = input?.toLowerCase() ?? "";

  if (/t(ü|u)rkiye|turkish|türk|\btr\b/.test(value)) {
    return getFrontierAsset("frontiertr");
  }

  if (/australia|\bau\b/.test(value)) {
    return getFrontierAsset("frontierau");
  }

  if (/\busa\b|united states|america/.test(value)) {
    return getFrontierAsset("frontierusa");
  }

  if (/fivem|five m/.test(value)) {
    return getFrontierAsset("frontierfivem");
  }

  if (/garry|gmod/.test(value)) {
    return getFrontierAsset("frontiergmod");
  }

  if (/roblox/.test(value)) {
    return getFrontierAsset("frontierroblox");
  }

  if (/rust/.test(value)) {
    return getFrontierAsset("frontierrust");
  }

  return getFrontierAsset("frontiernetworks");
}
