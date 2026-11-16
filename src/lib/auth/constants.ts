export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
// Loop guard: set for a few seconds after a refresh so a rejected fresh token can't redirect forever.
export const REFRESH_GUARD_COOKIE = "refresh_guard";
// The refresh token is only ever sent to our auth routes, never to pages or the data proxy.
export const REFRESH_COOKIE_PATH = "/api/auth";
export const IMPERSONATOR_BACKUP_COOKIE = "impersonator_token";
export const PLATFORM_STAFF_COOKIE = "platform_staff_token";
export const SUPPORT_SESSION_COOKIE = "support_session_id";
