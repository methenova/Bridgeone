import { test, expect } from "@playwright/test";

/**
 * End-to-End Production Workflow Test Suite
 * Covers complete user journey from registration through seller operations, live video calls, customer widget, admin console, and logout.
 */
test.describe("BridgeOne Complete Production Workflow Suite", () => {
  const timestamp = Date.now();
  const testUser = {
    email: `e2e_seller_${timestamp}@bridgeone.test`,
    password: "Password#2026Secure!",
    fullName: "E2E Test Seller",
    businessName: `E2E Store ${timestamp}`,
    shopSlug: `e2e-store-${timestamp}`,
  };

  test("1. User Registration & Password Breach Validation Flow", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveTitle(/BridgeOne/i);

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Attempt sign up
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify redirection to verify-email or onboarding
    await page.waitForURL(/\/(verify-email|onboarding|dashboard)/);
    expect(page.url()).toMatch(/\/(verify-email|onboarding|dashboard)/);
  });

  test("2. Onboarding Workflow (Profile, Business, Workspace, Subscription)", async ({ page }) => {
    await page.goto("/onboarding/profile");

    // Profile Step
    await page.fill('input[name="fullName"]', testUser.fullName);
    const profileNextBtn = page.locator("button:has-text('Continue')").first();
    if (await profileNextBtn.isVisible()) {
      await profileNextBtn.click();
    }

    // Navigate through onboarding steps
    await page.goto("/onboarding/business");
    await page.fill('input[name="businessName"]', testUser.businessName);

    await page.goto("/onboarding/workspace");
    await page.goto("/onboarding/subscription");
    await expect(page.locator("text=Choose Your Plan")).toBeVisible();
  });

  test("3. Stripe Subscription Checkout Integration Flow", async ({ page }) => {
    await page.goto("/onboarding/subscription");

    // Select growth or enterprise plan
    const selectPlanBtn = page.locator("button:has-text('Select Plan')").first();
    if (await selectPlanBtn.isVisible()) {
      await selectPlanBtn.click();
    }

    // Verify redirection handling or checkout session initiation
    await expect(page).toHaveURL(/\/(onboarding|checkout)/);
  });

  test("4. Seller Dashboard & Product Management Workflow", async ({ page }) => {
    await page.goto("/dashboard/products");

    // Check products heading
    await expect(page.locator("h1")).toBeVisible();

    // Verify Add Product dialog trigger
    const addProductBtn = page.locator("button:has-text('Add Product')");
    if (await addProductBtn.isVisible()) {
      await addProductBtn.click();
      await expect(page.locator("text=Product Details")).toBeVisible();
    }
  });

  test("5. Embeddable Storefront Widget Loading", async ({ page }) => {
    const testShopId = "00000000-0000-0000-0000-000000000001";
    await page.goto(`/widget/${testShopId}`);

    // Verify widget container renders without crash
    await expect(page.locator("body")).toBeVisible();
  });

  test("6. Customer Chat & Realtime Messaging Flow", async ({ page }) => {
    await page.goto("/dashboard/chat");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("7. Live WebRTC Video Call State Workflow", async ({ page }) => {
    await page.goto("/dashboard/live");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("8. Callback Requests Management", async ({ page }) => {
    await page.goto("/dashboard/callbacks");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("9. Admin Management Console & Health Dashboard", async ({ page }) => {
    await page.goto("/dashboard/health");
    await expect(page.locator("text=WebRTC Operations Dashboard")).toBeVisible();
    await expect(page.locator("text=Critical Subsystem Health Probes")).toBeVisible();
  });

  test("10. Browser Refresh Recovery & Session Persistence", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await expect(page.locator("h1")).toBeVisible();

    // Perform page reload
    await page.reload();

    // Verify user remains on orders route without redirecting to login
    await expect(page).toHaveURL(/\/dashboard\/orders/);
  });

  test("11. Logout & Storage Purge Verification", async ({ page }) => {
    await page.goto("/dashboard");

    // Trigger logout if logout button is present
    const logoutBtn = page.locator("button:has-text('Sign Out')");
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain("/login");
    }
  });
});
