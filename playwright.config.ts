import { defineConfig } from "@playwright/test";

const baseURL = process.env.FOUNDATION_WEB_URL ?? "http://localhost:3001";
const location = new URL(baseURL);

if (!["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) {
  throw new Error("The foundation fixtures must run against a loopback frontend.");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL,
    channel: process.env.FOUNDATION_BROWSER_CHANNEL,
    trace: "retain-on-failure",
  },
});
