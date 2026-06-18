export const applicationTypes = ["whitelist", "staff", "lspd", "bcso", "ems"] as const;
export type ApplicationType = (typeof applicationTypes)[number];

export const applicationTypeLabelKeys: Record<ApplicationType, string> = {
  whitelist: "application.typeWhitelist",
  staff: "application.typeStaff",
  lspd: "application.typeLspd",
  bcso: "application.typeBcso",
  ems: "application.typeEms"
};

export const characterApplicationTypes: readonly ApplicationType[] = ["whitelist", "lspd", "bcso", "ems"];

export function isApplicationType(value: string): value is ApplicationType {
  return applicationTypes.includes(value as ApplicationType);
}
