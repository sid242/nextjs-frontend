export const ACCESS_COOKIE = "at";
export const REFRESH_COOKIE = "rt";
// Loop guard: set for a few seconds after a refresh so a rejected fresh token can't redirect forever.
export const REFRESH_GUARD_COOKIE = "rg";
// The refresh token is only ever sent to our auth routes, never to pages or the data proxy.
export const REFRESH_COOKIE_PATH = "/api/auth";
