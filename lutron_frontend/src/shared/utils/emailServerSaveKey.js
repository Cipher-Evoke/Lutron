/**
 * Stable fingerprint for Email Server save payloads.
 * Used to skip duplicate Save clicks with unchanged form data.
 */
export function buildEmailServerSaveKey(payload) {
  return JSON.stringify({
    server_name: payload?.server_name ?? "",
    port: Number(payload?.port) || 0,
    server_email: payload?.server_email ?? "",
    sender_name: payload?.sender_name ?? "",
    app_password: payload?.app_password ?? "",
  });
}
