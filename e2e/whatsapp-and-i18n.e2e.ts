import { expect, test } from "@playwright/test";

const ownerEmail = process.env.FOUNDATION_OWNER_EMAIL ?? "owner@acme.com";
const password = process.env.FOUNDATION_FIXTURE_PASSWORD ?? "Password@123456";
const ownerSlug = process.env.FOUNDATION_OWNER_SLUG ?? "acme-realty";
const workspace = "/w/" + encodeURIComponent(ownerSlug);

test.describe("WhatsApp Business Integration & English/Hindi Language Switching", () => {
  test("end-to-end browser verification of WhatsApp tabs, template builder, multiple buttons, copy variables, and language switching", async ({
    page,
  }) => {
    // 1. Sign in to tenant workspace
    await page.goto(workspace + "/login");
    await expect(page).toHaveURL(new RegExp(`${workspace}/login`));

    await page.getByLabel(/email/i).first().fill(ownerEmail);
    await page.getByLabel(/^password/i).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${workspace}/dashboard$`));

    // 2. Navigate to WhatsApp integration settings
    await page.goto(`${workspace}/settings/integrations/whatsapp`);
    await expect(page).toHaveURL(new RegExp(`${workspace}/settings/integrations/whatsapp$`));

    // Verify WhatsApp page heading
    await expect(page.getByRole("heading", { name: "WhatsApp Business Settings" })).toBeVisible();

    // Verify all 9 tabs are present
    const expectedTabs = [
      "Overview",
      "Account",
      "Phone Numbers",
      "Templates",
      "Inbox",
      "Compose & Logs",
      "Campaigns",
      "Contacts",
      "Usage & Billing",
    ];

    for (const tabName of expectedTabs) {
      await expect(page.getByRole("tab", { name: tabName, exact: true })).toBeVisible();
    }

    // 3. Test Template Builder Dialog & Features
    await page.getByRole("tab", { name: "Templates", exact: true }).click();
    await page.waitForTimeout(500);

    const createTemplateBtn = page.getByRole("button", { name: "Create Template" });
    await expect(createTemplateBtn).toBeVisible();
    await createTemplateBtn.click();

    // Check Dialog opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Create WhatsApp Message Template")).toBeVisible();

    // Verify template fields
    await expect(page.getByLabel(/Template Name/i)).toBeVisible();
    await expect(page.getByLabel(/Body Text/i)).toBeVisible();

    // Verify dynamic variables helper toolbar and one-click copy button
    const copyVar1 = page.locator('button[title="Copy {{1}} to clipboard"]');
    await expect(copyVar1).toBeVisible();
    await copyVar1.click();

    // Verify interactive buttons section and multiple buttons support
    const addBtn = page.getByRole("button", { name: "Add Button" });
    await expect(addBtn).toBeVisible();

    // Click Add Button to add Button #1
    await addBtn.click();
    await expect(page.getByText("Button #1")).toBeVisible();

    // Click Add Button to add Button #2 (testing multiple buttons)
    await addBtn.click();
    await expect(page.getByText("Button #2")).toBeVisible();

    // Verify mobile preview is visible
    await expect(page.getByText("WhatsApp Mobile Preview")).toBeVisible();

    // Close Dialog
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // 4. Test Language Switching to Hindi
    const langBtn = page.getByRole("button", { name: "Change language" });
    await expect(langBtn).toBeVisible();
    await langBtn.click();

    // Select Hindi from dropdown
    const hindiItem = page.getByRole("menuitem", { name: /हिन्दी/i });
    await expect(hindiItem).toBeVisible();
    await hindiItem.click();

    // Wait for language update and router refresh
    await page.waitForTimeout(1000);

    // Verify SSR/HTML attribute
    const htmlLangHi = await page.getAttribute("html", "lang");
    expect(htmlLangHi).toBe("hi");

    // Verify sidebar navigation items translated to Hindi
    await expect(page.getByText("डैशबोर्ड").first()).toBeVisible();
    await expect(page.getByText("सेटिंग्स").first()).toBeVisible();

    // Verify settings nav tab for WhatsApp translated to Hindi
    await expect(page.getByText("व्हाट्सएप").first()).toBeVisible();

    // 5. Switch back to English
    const langBtnHi = page.getByRole("button", { name: "Change language" });
    await expect(langBtnHi).toBeVisible();
    await langBtnHi.click();

    const enItem = page.getByRole("menuitem", { name: /English/i });
    await expect(enItem).toBeVisible();
    await enItem.click();

    await page.waitForTimeout(1000);

    const htmlLangEn = await page.getAttribute("html", "lang");
    expect(htmlLangEn).toBe("en");

    // Verify it switched back to English
    await expect(page.getByText("Dashboard").first()).toBeVisible();
    await expect(page.getByText("Settings").first()).toBeVisible();
  });
});
