import { expect, test, type Page } from "@playwright/test";

import { ACCESS_COOKIE, PLATFORM_STAFF_COOKIE } from "../src/lib/auth/constants";

const staffEmail = process.env.FOUNDATION_STAFF_EMAIL ?? "sid.superadmin@yopmail.com";
const ownerEmail = process.env.FOUNDATION_OWNER_EMAIL ?? "owner@acme.com";
const viewerEmail = process.env.FOUNDATION_VIEWER_EMAIL ?? "viewer@acme.com";
const password = process.env.FOUNDATION_FIXTURE_PASSWORD ?? "Password@123456";
const ownerSlug = process.env.FOUNDATION_OWNER_SLUG ?? "acme-realty";
const leadsAvailable = process.env.FOUNDATION_EXPECT_LEADS !== "false";
const pairedFixtures = process.env.FOUNDATION_EXTENDED_FIXTURES === "true";
const workspace = "/w/" + encodeURIComponent(ownerSlug);

async function signIn(
  page: Page,
  path: string,
  email: string,
  destination: string,
  submitLabel = "Sign in",
) {
  await page.goto(path);
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole("button", { name: submitLabel, exact: true }).click();
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
  await signIn(
    page,
    "/platform/login?next=%2Fplatform%2Ftenants",
    staffEmail,
    "/platform/tenants",
    "Authenticate Platform Session",
  );
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

test("an already signed-in viewer loses workspace access when the owner suspends membership", async ({
  browser,
  page,
}) => {
  await signIn(page, workspace + "/login", ownerEmail, workspace + "/dashboard");

  const viewer = await browser.newPage();
  await signIn(viewer, workspace + "/login", viewerEmail, workspace + "/dashboard");
  const readFiles = () => viewer.evaluate(async () => (await fetch("/api/proxy/files")).status);
  expect(await readFiles()).toBe(200);
  if (pairedFixtures) {
    const stream = viewer.waitForResponse((response) =>
      response.url().endsWith("/api/proxy/files/events/stream"),
    );
    await viewer.evaluate(() => {
      const source = new EventSource("/api/proxy/files/events/stream");
      source.addEventListener("error", () => {
        document.documentElement.dataset.fixtureFileStream = "closed";
        source.close();
      });
    });
    expect((await stream).status()).toBe(200);
  }

  const memberPath = "/api/proxy/tenants/" + ownerSlug + "/members";
  const member = await page.evaluate(
    async ({ path, email }) => {
      const response = await fetch(path + "?limit=50");
      const { data } = await response.json();
      const members: Array<{ id: string; email: string; status: string }> = data?.items ?? [];
      return members.find((item) => item.email === email);
    },
    { path: memberPath, email: viewerEmail },
  );
  expect(member?.status).toBe("ACTIVE");

  const setMembershipStatus = (status: "ACTIVE" | "SUSPENDED") =>
    page.evaluate(
      async ({ path, nextStatus }) => {
        const response = await fetch(path, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        return response.status;
      },
      { path: memberPath + "/" + member?.id + "/status", nextStatus: status },
    );

  try {
    expect(await setMembershipStatus("SUSPENDED")).toBe(200);
    expect([401, 403]).toContain(await readFiles());
    if (pairedFixtures) {
      await expect(viewer.locator("html")).toHaveAttribute("data-fixture-file-stream", "closed");
    }
  } finally {
    try {
      expect(await setMembershipStatus("ACTIVE")).toBe(200);
    } finally {
      await viewer.close();
    }
  }
});

test("switching workspaces updates the effective tenant and permissions including browser back", async ({
  page,
}) => {
  test.skip(!pairedFixtures, "Requires the companion browser fixture command");
  await signIn(page, workspace + "/login", ownerEmail, workspace + "/dashboard");
  await page.goto(workspace + "/files");
  await expect(page.getByRole("button", { name: "Upload Files", exact: true })).toBeVisible();
  const switcher = page.getByRole("button", { name: "Switch organization" });
  await switcher.press("ArrowDown");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(switcher).toBeFocused();
  await switcher.press("ArrowDown");
  await page.getByRole("menuitem", { name: /nexus-global/ }).press("Enter");
  await expect(page).toHaveURL(/\/w\/nexus-global\/dashboard$/);
  await page.getByRole("link", { name: /^Files$/i }).click();
  await expect(page.getByRole("heading", { name: "Files & Storage" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload Files", exact: true })).toHaveCount(0);
  const result = await page.evaluate(async () => {
    const response = await fetch("/api/proxy/tenants/nexus-global/context");
    const { data } = await response.json();
    return { status: response.status, slug: data?.tenant?.slug };
  });
  expect(result).toEqual({ status: 200, slug: "nexus-global" });
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/\/w\/acme-realty\/files$/);
  await expect(page.getByRole("button", { name: "Upload Files", exact: true })).toBeVisible();

  await switcher.press("ArrowDown");
  await page.getByRole("menuitem", { name: /nexus-global/ }).press("Enter");
  await expect(page).toHaveURL(/\/w\/nexus-global\/dashboard$/);
  await switcher.press("ArrowDown");
  await page.getByRole("menuitem", { name: ownerSlug }).press("Enter");
  await expect(page).toHaveURL(new RegExp(workspace + "/dashboard$"));
  await page.goto(workspace + "/files");
  await expect(page.getByRole("button", { name: "Upload Files", exact: true })).toBeVisible();
});

test("signing in as another user in the same tab clears the previous permissions", async ({
  page,
}) => {
  await signIn(page, workspace + "/login", ownerEmail, workspace + "/dashboard");
  await page.goto(workspace + "/files");
  await expect(page.getByRole("button", { name: "Upload Files", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Account menu" }).press("Enter");
  await page.getByRole("menuitem", { name: "Log out", exact: true }).press("Enter");
  await expect(page.getByLabel(/^password/i)).toBeVisible();
  expect((await page.context().cookies()).some(({ name }) => name === ACCESS_COOKIE)).toBe(false);

  await signIn(page, workspace + "/login", viewerEmail, workspace + "/dashboard");
  await page.goto(workspace + "/files");
  await expect(page.getByRole("heading", { name: "Files & Storage" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload Files", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Account menu" }).press("Enter");
  await expect(page.getByRole("menu").getByText(viewerEmail, { exact: true })).toBeVisible();
  await expect(page.getByRole("menu").getByText(ownerEmail, { exact: true })).toHaveCount(0);
});

test("the workspace switcher hands off to the configured subdomain", async ({ page }) => {
  test.skip(!pairedFixtures, "Requires the companion browser fixture command");
  await signIn(page, workspace + "/login", ownerEmail, workspace + "/dashboard");
  const source = new URL(page.url());
  await page.getByRole("button", { name: "Switch organization" }).click();
  await page.getByRole("menuitem", { name: /starlight-ventures/ }).click();

  const target = new URL(source);
  target.hostname = "starlight-ventures." + source.hostname;
  target.pathname = "/dashboard";
  await expect(page).toHaveURL(target.toString());
  const workspaceContext = await page.evaluate(async () => {
    const response = await fetch("/api/proxy/tenants/starlight-ventures/context");
    return { status: response.status, slug: (await response.json())?.data?.tenant?.slug };
  });
  expect(workspaceContext).toEqual({ status: 200, slug: "starlight-ventures" });
  const destinationCookies = await page.context().cookies(target.toString());
  expect(
    destinationCookies.some(
      ({ name, domain }) => name === ACCESS_COOKIE && domain === target.hostname,
    ),
  ).toBe(true);
});

async function openReadOnlySupportWorkspace(page: Page) {
  await signIn(
    page,
    "/platform/login",
    staffEmail,
    "/platform/dashboard",
    "Authenticate Platform Session",
  );
  const origin = new URL(page.url()).origin;
  const tenants = await page.request.get("/api/proxy/platform/tenants?limit=50");
  expect(tenants.ok()).toBe(true);
  const records = (await tenants.json())?.data?.items as Array<{ id: string; slug: string }>;
  const target = records.find((tenant) => tenant.slug === ownerSlug);
  expect(target).toBeDefined();

  const started = await page.request.post(
    "/api/proxy/platform/tenants/" + target?.id + "/support-sessions",
    {
      headers: { origin },
      data: { scope: "READ_ONLY", durationMinutes: 5, reason: "Local foundation verification" },
    },
  );
  expect(started.ok()).toBe(true);
  const sessionId = (await started.json())?.data?.sessionId;
  expect(sessionId).toBeTruthy();

  const entered = await page.request.post("/api/platform/support-session/enter", {
    headers: { origin },
    data: { sessionId },
  });
  expect(entered.ok()).toBe(true);
  await page.goto(workspace + "/dashboard");
  const banner = page.getByLabel("Platform support session banner");
  await expect(banner.getByText("READ-ONLY MODE")).toBeVisible();
  await expect(banner.locator("time")).toBeVisible();
  return { banner, sessionId, origin };
}

test("read-only support access ends without ending the staff session", async ({ page }) => {
  test.skip(!pairedFixtures, "Requires the companion support lifecycle contract");
  const { banner } = await openReadOnlySupportWorkspace(page);
  await banner.getByRole("button", { name: "Exit Support Session" }).click();
  await expect(page).toHaveURL(/\/platform\/support-sessions$/);
  const cookies = await page.context().cookies();
  expect(cookies.some(({ name }) => name === PLATFORM_STAFF_COOKIE)).toBe(true);
  expect(cookies.some(({ name }) => name === "support_session_id")).toBe(false);
});

test("the browser returns to the platform when the support expiry timer fires", async ({
  page,
}) => {
  test.skip(!pairedFixtures, "Requires the companion support lifecycle contract");
  await page.clock.install();
  const { sessionId, origin } = await openReadOnlySupportWorkspace(page);

  try {
    await page.clock.fastForward("05:01");
    await expect(page).toHaveURL(/\/platform\/support-sessions$/);
    expect((await page.request.get("/api/proxy/platform/tenants?limit=1")).status()).toBe(200);
  } finally {
    await page.request.post("/api/platform/support-session/exit", {
      headers: { origin },
      data: { sessionId },
    });
  }
});
