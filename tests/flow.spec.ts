import { test, expect, type Page } from "@playwright/test";
import { testPng } from "./png";

const shots = (process.env.SHOTS ?? "") !== "";

async function snap(page: Page, name: string) {
  if (!shots) return;
  await page.waitForTimeout(400);
  const vp = page.viewportSize()!;
  await page.screenshot({ path: `screenshots/${test.info().project.name}-${vp.width}x${vp.height}-${name}.png` });
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

test("today: past slots are off, emergency slot works, a slot that goes stale is refused", async ({ page }) => {
  const setNow = (iso: string) => page.evaluate((t) => (window as unknown as { __setNow(t: string): void }).__setNow(t), iso);
  await page.goto("/?test=1");
  await setNow("2026-10-02T10:32:00Z"); // 16:02 IST, Friday 2 October 2026
  await page.getByTestId("book").click();
  await page.getByTestId("day-2026-10-02").click();
  await page.getByTestId("next").click();
  await expect(page.getByTestId("slot-16:00")).toBeDisabled();
  await expect(page.getByTestId("slot-16:30")).toBeEnabled();
  await page.getByTestId("slot-now").click();
  await expect(page.getByTestId("time-caption")).toHaveText("4:20 PM on Friday. Noted.");
  // the page sits open until 16:40, then she taps 16:30
  await setNow("2026-10-02T11:10:00Z");
  await page.getByTestId("slot-16:30").click();
  await expect(page.getByTestId("toast")).toHaveText("That time just passed. Pick a later one.");
  await expect(page.getByTestId("slot-16:30")).toBeDisabled();
});

test("editing the date to make the time stale redirects before the pass, not after", async ({ page }) => {
  const setNow = (iso: string) => page.evaluate((t) => (window as unknown as { __setNow(t: string): void }).__setNow(t), iso);
  await page.goto("/?test=1");
  await setNow("2026-10-01T04:30:00Z"); // 10:00 IST, Thursday 1 October 2026
  await page.getByTestId("book").click();
  await page.getByTestId("day-2026-10-02").click(); // tomorrow
  await page.getByTestId("next").click();
  await page.getByTestId("slot-09:00").click(); // fine for tomorrow
  await page.getByTestId("next").click();
  await page.getByTestId("place-NAB").click();
  await page.getByTestId("next").click();
  await page.getByRole("button", { name: "Missing you" }).click();
  await page.getByTestId("next").click();
  await page.getByTestId("gallery-input").setInputFiles({ name: "cute.png", mimeType: "image/png", buffer: testPng() });
  await expect(page.locator(".pay-polaroid img")).toBeVisible();
  await page.getByTestId("next").click();
  await expect(page.getByTestId("step-count")).toHaveText("step 6/6");

  // edit the date to today: 09:00 today is already in the past at 10:00 now, so date.ts clears the time
  await page.getByTestId("edit-date").click();
  await expect(page.getByTestId("step-count")).toHaveText("step 1/6");
  await page.getByTestId("day-2026-10-01").click();
  await page.getByTestId("next").click(); // "Back to pass"

  // must land back on the time step, not on a pass with no time
  await expect(page.getByTestId("step-count")).toHaveText("step 2/6");
  await expect(page.getByTestId("toast")).toHaveText("Pick a time. Any time you like.");
});

test("a slot that goes stale while sitting on the pass is caught at confirm, not booked", async ({ page }) => {
  const setNow = (iso: string) => page.evaluate((t) => (window as unknown as { __setNow(t: string): void }).__setNow(t), iso);
  await page.goto("/?test=1");
  await setNow("2026-10-02T10:32:00Z"); // 16:02 IST, Friday 2 October 2026
  await page.getByTestId("book").click();
  await page.getByTestId("day-2026-10-02").click();
  await page.getByTestId("next").click();
  await page.getByTestId("slot-16:30").click();
  await page.getByTestId("next").click();
  await page.getByTestId("place-NAB").click();
  await page.getByTestId("next").click();
  await page.getByRole("button", { name: "Missing you" }).click();
  await page.getByTestId("next").click();
  await page.getByTestId("gallery-input").setInputFiles({ name: "cute.png", mimeType: "image/png", buffer: testPng() });
  await expect(page.locator(".pay-polaroid img")).toBeVisible();
  await page.getByTestId("next").click();
  await expect(page.getByTestId("step-count")).toHaveText("step 6/6");

  // she leaves the pass open until 16:30 has come and gone, then confirms
  await setNow("2026-10-02T11:05:00Z"); // 16:35 IST
  await page.getByTestId("confirm").click();
  await expect(page.getByTestId("toast")).toHaveText("Pick a time. Any time you like.");
  await expect(page.getByTestId("step-count")).toHaveText("step 2/6");
  await expect(page.getByRole("heading", { name: "Appointment booked" })).toHaveCount(0);
});

test("the garden keeps swaying after leaving Hello (its tweens must outlive Hello's scene)", async ({ page }) => {
  await page.goto("/?test=1");
  await page.waitForTimeout(300); // let the corner garden bloom in
  await page.getByTestId("book").click();
  await expect(page.getByTestId("step-count")).toHaveText("step 1/6");
  await page.waitForTimeout(100); // settle into the wizard, well after Hello's context would have reverted
  const sample = () => page.locator(".flower .sway").first().getAttribute("transform");
  const seen = new Set<string | null>();
  for (let i = 0; i < 6; i++) {
    seen.add(await sample());
    await page.waitForTimeout(80);
  }
  expect(seen.size).toBeGreaterThan(1);
});

test("double Enter on Book another only ever mounts one Hello scene", async ({ page }) => {
  await book(page);
  await expect(page.getByRole("heading", { name: "Appointment booked" })).toBeVisible();
  await page.getByTestId("again").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200); // let both attempts finish, if the guard failed to stop the second
  await expect(page.locator(".scene.hello")).toHaveCount(1);
});
