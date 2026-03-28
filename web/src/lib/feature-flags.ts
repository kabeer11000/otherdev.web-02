"use client";

const FEATURE_FLAGS = {
  USE_AI_SDK_CHAT: false,
  USE_AI_SDK_ATTACHMENTS: false,
  USE_AI_SDK_TOOLS: false,
};

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  if (typeof window === "undefined") return FEATURE_FLAGS[flag];
  
  const urlParams = new URLSearchParams(window.location.search);
  const override = urlParams.get(`flag_${flag}`);
  
  if (override !== null) {
    return override === "true";
  }
  
  return FEATURE_FLAGS[flag];
}

export function setFeatureFlag(
  flag: keyof typeof FEATURE_FLAGS,
  enabled: boolean
): void {
  if (typeof window === "undefined") return;
  
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(`flag_${flag}`, enabled.toString());
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${urlParams.toString()}`
  );
}

export { FEATURE_FLAGS };
