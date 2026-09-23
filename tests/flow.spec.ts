import { test, expect, type Page } from "@playwright/test";
import { testPng } from "./png";

const shots = (process.env.SHOTS ?? "") !== "";

async function snap(page: Page, name: string) {
  if (!shots) return;
  await page.waitForTimeout(400);
  const vp = page.viewportSize()!;
  await page.screenshot({ path: `screenshots/${vp.width}x${vp.height}-${name}.png` });
}

async function book(page: Page, confirm = true) {
  await page.goto("/?test=1");
  await expect(page.getByTestId("book")).toBeVisible();
  await snap(page, "1-hello");
  await page.getByTestId("book").click();

  // step 1: first available date
  await expect(page.getByTestId("step-count")).toHaveText("step 1/6");
  await page.locator('[data-testid^="day-"]:not([aria-disabled="true"])').first().click();
  await snap(page, "2-date");
  await page.getByTestId("next").click();

  // step 2: first enabled slot
  await expect(page.getByTestId("step-count")).toHaveText("step 2/6");
  await page.locator('[data-testid^="slot-"]:not([disabled])').first().click();
  await expect(page.getByTestId("time-caption")).toContainText("Noted.");
  await snap(page, "3-time");
  await page.getByTestId("next").click();

  // step 3: NAB
  await expect(page.getByTestId("step-count")).toHaveText("step 3/6");
  await page.getByTestId("place-NAB").click();
  await snap(page, "4-place");
  await page.getByTestId("next").click();

  // step 4: Missing you
  await expect(page.getByTestId("step-count")).toHaveText("step 4/6");
  await page.getByRole("button", { name: "Missing you" }).click();
  await snap(page, "5-reason");
  await page.getByTestId("next").click();

  // step 5: no photo = no booking
  await expect(page.getByTestId("step-count")).toHaveText("step 5/6");
  await expect(page.getByTestId("next")).toHaveAttribute("aria-disabled", "true");
  await page.getByTestId("next").click({ force: true });
  await expect(page.getByTestId("toast")).toHaveText("Payment pending: one cute pic.");
  await expect(page.getByTestId("step-count")).toHaveText("step 5/6");
  await page.getByTestId("gallery-input").setInputFiles({ name: "cute.png", mimeType: "image/png", buffer: testPng() });
  await expect(page.locator(".pay-polaroid img")).toBeVisible();
  await expect(page.getByTestId("next")).toHaveAttribute("aria-disabled", "false");
  await snap(page, "6-payment");
  await page.getByTestId("next").click();

  // step 6: review + confirm
  await expect(page.getByTestId("step-count")).toHaveText("step 6/6");
  await expect(page.getByTestId("ticket-id")).toHaveText(/^LOVE-[2-9A-HJ-NP-Z]{4}$/);
  await snap(page, "7-review");
  if (confirm) await page.getByTestId("confirm").click();
}

test("book an appointment end to end", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await book(page);
  await expect(page.getByRole("heading", { name: "Appointment booked" })).toBeVisible();
  await expect(page.getByTestId("send")).toBeVisible();
  await expect(page.getByTestId("save")).toBeVisible();
  await expect(page.getByTestId("calendar")).toBeVisible();
  await snap(page, "8-success");

  // outputs: PNG pass + calendar file
  const png = page.waitForEvent("download");
  await page.getByTestId("save").click();
  expect((await png).suggestedFilename()).toMatch(/^tanvi-appointment-LOVE-\w{4}\.png$/);
  const ics = page.waitForEvent("download");
  await page.getByTestId("calendar").click();
  expect((await ics).suggestedFilename()).toMatch(/\.ics$/);

  // history: counter appears on Hello after booking another
  await page.getByTestId("again").click();
  await expect(page.getByTestId("history-count")).toContainText("1");
  await page.getByTestId("history-count").click();
  await expect(page.getByTestId("history-sheet")).toContainText("NAB");
  await snap(page, "9-history");
  expect(errors).toEqual([]);
});

test("confirm re-checks the photo: no photo, no booking", async ({ page }) => {
  await book(page, false);
  // edit the photo from the pass, retake (clears it), then go Back to the pass without one
  await page.getByTestId("edit-photo").click();
  await expect(page.getByTestId("step-count")).toHaveText("step 5/6");
  await page.getByTestId("retake").click();
  await page.goBack();
  await expect(page.getByTestId("step-count")).toHaveText("step 6/6");
  await page.getByTestId("confirm").click();
  await expect(page.getByTestId("toast")).toHaveText("Payment pending: one cute pic.");
  await expect(page.getByTestId("step-count")).toHaveText("step 5/6");
  await expect(page.getByRole("heading", { name: "Appointment booked" })).toHaveCount(0);
});

test("android back walks back through steps, then home", async ({ page }) => {
  await page.goto("/?test=1");
  await page.getByTestId("book").click();
  await page.locator('[data-testid^="day-"]:not([aria-disabled="true"])').first().click();
  await page.getByTestId("next").click();
  await expect(page.getByTestId("step-count")).toHaveText("step 2/6");
  await page.goBack();
  await expect(page.getByTestId("step-count")).toHaveText("step 1/6");
  await page.goBack();
  await expect(page.getByTestId("book")).toBeVisible();
});

test("keyboard alone can finish the flow", async ({ page }) => {
  await page.goto("/?test=1");
  await page.getByTestId("book").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("step-count")).toHaveText("step 1/6");
  // move into the grid, then arrow to a future day and select it
  await page.locator('.day[tabindex="0"]').focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("date-label")).not.toContainText("Tap a day");
  await page.getByTestId("next").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("step-count")).toHaveText("step 2/6");
  await page.locator('[data-testid^="slot-"]:not([disabled])').first().focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("next").focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("place-SR-BLOCK").focus();
  await page.keyboard.press("Space");
  await page.getByTestId("next").focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("note").focus();
  await page.keyboard.type("hi");
  await page.getByTestId("next").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("step-count")).toHaveText("step 5/6");
  await page.getByTestId("gallery-input").setInputFiles({ name: "cute.png", mimeType: "image/png", buffer: testPng() });
  await expect(page.locator(".pay-polaroid img")).toBeVisible();
  await page.getByTestId("next").focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("confirm").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Appointment booked" })).toBeVisible();
});
