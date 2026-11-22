import { expect, test, type Page } from "@playwright/test";

import { PLATFORM_STAFF_COOKIE } from "../src/lib/auth/constants";

const staffEmail = process.env.FOUNDATION_STAFF_EMAIL ?? "sid.superadmin@yopmail.com";
const ownerEmail = process.env.FOUNDATION_OWNER_EMAIL ?? "owner@acme.com";
const viewerEmail = process.env.FOUNDATION_VIEWER_EMAIL ?? "viewer@acme.com";
const password = process.env.FOUNDATION_FIXTURE_PASSWORD ?? "Password@123456";
const ownerSlug = process.env.FOUNDATION_OWNER_SLUG ?? "acme-realty";
const leadsAvailable = process.env.FOUNDATION_EXPECT_LEADS !== "false";
const workspace = "/w/" + encodeURIComponent(ownerSlug);

async function signIn(page: Page, path: string, email: string, destination: string) {
  await page.goto(path);
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(destination + "$"));
}

test.beforeEach(async ({ request }) => {
  await expect.poll(async () => (await request.get("/api/ready")).status()).toBe(200);
});

test("platform staff sign in independently and lose protected access on sign-out", async ({
  page,
}) => {
  await page.goto("/platform/tenants");
  await expect(page).toHaveURL(/\/platform\/login\?next=/);
  await signIn(page, "/platform/login?next=%2Fplatform%2Ftenants", staffEmail, "/platform/tenants");
  await expect(page.getByRole("heading", { name: "Customer Workspaces" })).toBeVisible();

  const staffCookies = await page.context().cookies();
  expect(staffCookies.some(({ name }) => name === PLATFORM_STAFF_COOKIE)).toBe(true);

  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/\/platform\/login/);
  await page.goto("/platform/tenants");
  await expect(page).toHaveURL(/\/platform\/login\?next=/);
});

test("tenant owner can use Files and sees the configured module state", async ({ page }) => {
  await signIn(page, workspace + "/login", ownerEmail, workspace + "/dashboard");
  await page.goto(workspace + "/files");
  await expect(page.getByRole("heading", { name: "Files & Storage" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload Files", exact: true })).toBeVisible();

  const context = await page.evaluate(async (slug) => {
    const response = await fetch("/api/proxy/tenants/" + slug + "/context");
    const { data } = await response.json();
    return {
      status: response.status,
      slug: data?.tenant?.slug,
      leads: data?.businessModules?.leads,
    };
  }, ownerSlug);
  expect(context).toEqual({ status: 200, slug: ownerSlug, leads: leadsAvailable });

  await page.goto(workspace + "/leads");
  if (leadsAvailable) {
    await expect(page.getByRole("heading", { name: "CRM Leads", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create Lead", exact: true })).toBeVisible();
  } else {
    await expect(
      page.getByRole("heading", { name: "Module unavailable", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "CRM Leads", exact: true })).toHaveCount(0);
  }
});

test("tenant viewer can read workspace files but cannot mutate or open the Leads form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, workspace + "/login", viewerEmail, workspace + "/dashboard");
  await page.goto(workspace + "/files");
  await expect(page.getByRole("heading", { name: "Files & Storage" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload Files", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New Folder", exact: true })).toHaveCount(0);

  const deniedStatus = await page.evaluate(async () => {
    const result = await fetch("/api/proxy/files/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: "denied.pdf", contentType: "application/pdf" }),
    });
    return result.status;
  });
  expect(deniedStatus).toBe(403);

  await page.goto(workspace + "/leads/new");
  await expect(
    page.getByRole("heading", {
      name: leadsAvailable ? "Access Restricted" : "Module unavailable",
    }),
  ).toBeVisible();
});

test("member import preview is read-only and a confirmed batch has one scoped job", async ({
  page,
}) => {
  await signIn(page, workspace + "/login", ownerEmail, workspace + "/dashboard");
  const result = await page.evaluate(async (slug) => {
    const prefix = "/api/proxy/tenants/" + slug + "/members/import";
    const rows = [{ email: "foundation-" + crypto.randomUUID() + "@example.test", role: "MEMBER" }];
    const post = (route: string, body: unknown) =>
      fetch(prefix + route, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    const preview = await post("/validate", { rows });
    const repeatPreview = await post("/validate", { rows });
    const first = await post("/jobs", { rows, sendInviteEmails: false });
    const duplicate = await post("/jobs", { rows, sendInviteEmails: false });
    const [previewBody, repeatPreviewBody, firstBody, duplicateBody] = await Promise.all(
      [preview, repeatPreview, first, duplicate].map((response) => response.json()),
    );
    return {
      valid: previewBody?.data?.validCount,
      repeatValid: repeatPreviewBody?.data?.validCount,
      statuses: [first.status, duplicate.status],
      firstJob: firstBody?.data?.id as string | undefined,
      duplicateJob: duplicateBody?.data?.id as string | undefined,
    };
  }, ownerSlug);
  expect(result.valid).toBe(1);
  expect(result.repeatValid).toBe(1);
  expect(result.statuses).toEqual([202, 202]);
  expect(result.firstJob).toBeTruthy();
  expect(result.duplicateJob).toBe(result.firstJob);

  await expect
    .poll(
      () =>
        page.evaluate(
          async (path) => {
            const response = await fetch(path);
            const { data } = await response.json();
            return {
              status: response.status,
              state: data?.state,
              imported: data?.result?.importedCount,
            };
          },
          "/api/proxy/tenants/" + ownerSlug + "/members/import/jobs/" + result.firstJob,
        ),
      { timeout: 30_000 },
    )
    .toEqual({ status: 200, state: "completed", imported: 1 });
});
