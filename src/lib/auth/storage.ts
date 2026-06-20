import type { SupportedStorage } from "@supabase/supabase-js";

export const REMEMBER_ME_KEY = "chatcrm_remember_me";

export function isRememberMeEnabled(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(REMEMBER_ME_KEY) !== "0";
}

export function setRememberMe(enabled: boolean) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(REMEMBER_ME_KEY, enabled ? "1" : "0");
}

function pickStorage(): Storage {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
  return isRememberMeEnabled() ? localStorage : sessionStorage;
}

/** Supabase auth storage — sessionStorage when "Remember me" is off. */
export const authStorage: SupportedStorage = {
  getItem(key: string) {
    return pickStorage().getItem(key);
  },
  setItem(key: string, value: string) {
    pickStorage().setItem(key, value);
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};
