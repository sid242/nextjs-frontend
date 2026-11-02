/**
 * Centralized, safe client-side storage & cookie utilities with SSR guards and error handling.
 */

export const clientStorage = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  getJSON<T>(key: string, fallback: T | null = null): T | null {
    const raw = this.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON<T>(key: string, value: T): boolean {
    try {
      return this.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },

  removeItem(key: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear(): boolean {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

export const clientCookie = {
  get(name: string): string | null {
    if (typeof document === "undefined") return null;
    try {
      const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
      return match?.[1] ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  },

  set(
    name: string,
    value: string,
    options: {
      maxAge?: number;
      path?: string;
      sameSite?: "Lax" | "Strict" | "None";
      secure?: boolean;
    } = {},
  ): void {
    if (typeof document === "undefined") return;
    try {
      const {
        maxAge = 31536000, // 1 year
        path = "/",
        sameSite = "Lax",
        secure = false,
      } = options;
      const securePart = secure ? "; Secure" : "";
      document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}; SameSite=${sameSite}${securePart}`;
    } catch {
      /* ignore cookie errors */
    }
  },

  remove(name: string, path = "/"): void {
    if (typeof document === "undefined") return;
    try {
      document.cookie = `${name}=; path=${path}; max-age=0; SameSite=Lax`;
    } catch {
      /* ignore cookie errors */
    }
  },
};
