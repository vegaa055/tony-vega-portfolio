import { expect, test, type Page } from "@playwright/test";

// The home page's nebula. Test browsers draw WebGL on the CPU, which the
// nebula normally declines; most of these tests let it run there anyway.

const nebula = (page: Page) => page.locator("[data-nebula]");

async function allowSoftwareRendering(page: Page) {
  await page.addInitScript(() => {
    (window as { __nebulaAllowSoftware?: boolean }).__nebulaAllowSoftware =
      true;
  });
}

/** Collects errors the page reports, to check that there are none. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

/** Moves the pointer through the hero, which also starts the nebula. */
async function stir(page: Page) {
  const box = await page.locator("main section").first().boundingBox();
  if (!box) throw new Error("The hero isn't on the page.");
  for (let i = 0; i <= 20; i++) {
    await page.mouse.move(
      box.x + box.width * (0.4 + 0.5 * (i / 20)),
      box.y + box.height * (0.4 + 0.2 * Math.sin(i / 3)),
    );
  }
}

async function expectStatus(page: Page, status: string) {
  // Starting includes loading Three.js and drawing the clouds on the CPU.
  await expect(nebula(page)).toHaveAttribute("data-nebula", status, {
    timeout: 30_000,
  });
}

test("the nebula starts on the first interaction and fades in", async ({
  page,
}) => {
  await allowSoftwareRendering(page);
  const errors = collectErrors(page);
  await page.goto("/");

  await expect(nebula(page)).toHaveAttribute("data-nebula", "waiting");
  await expect(nebula(page)).toHaveAttribute("aria-hidden", "true");
  await stir(page);
  await expectStatus(page, "running");

  const canvas = nebula(page).locator("canvas");
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveCSS("opacity", "1");
  await stir(page);
  expect(errors).toEqual([]);
});

test("the nebula starts by itself once the page has settled", async ({
  page,
}) => {
  await allowSoftwareRendering(page);
  await page.goto("/");
  await expectStatus(page, "running");
});

test("the nebula pauses while it's out of view", async ({ page }) => {
  await allowSoftwareRendering(page);
  await page.goto("/");
  await stir(page);
  await expectStatus(page, "running");

  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  await expectStatus(page, "paused");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectStatus(page, "running");
});

test("visitors who prefer reduced motion get a still nebula", async ({
  page,
}) => {
  await allowSoftwareRendering(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await stir(page);
  await expectStatus(page, "still");
  await expect(nebula(page).locator("canvas")).toHaveCSS("opacity", "1");

  // Turning the setting off starts the motion.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expectStatus(page, "running");
});

test("browsers without WebGL 2 keep the CSS nebula, quietly", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const canvas = HTMLCanvasElement.prototype as unknown as {
      getContext: (...args: unknown[]) => unknown;
    };
    const getContext = canvas.getContext;
    canvas.getContext = function (this: HTMLCanvasElement, ...args) {
      return args[0] === "webgl2" ? null : getContext.apply(this, args);
    };
  });
  const errors = collectErrors(page);
  await page.goto("/");
  await stir(page);

  await expectStatus(page, "unsupported");
  await expect(nebula(page).locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("GPUs that draw on the CPU keep the CSS nebula", async ({ page }) => {
  // Report a software renderer, whatever the test machine really has.
  await page.addInitScript(() => {
    const context = WebGL2RenderingContext.prototype;
    const getParameter = context.getParameter;
    const UNMASKED_RENDERER = 0x9246;
    context.getParameter = function (this: WebGL2RenderingContext, name) {
      return name === UNMASKED_RENDERER || name === this.RENDERER
        ? "Google SwiftShader"
        : getParameter.call(this, name);
    };
  });
  await page.goto("/");
  await stir(page);

  await expectStatus(page, "unsupported");
  await expect(nebula(page).locator("canvas")).toHaveCount(0);
});

test("the hero's links still work over the nebula, and it restarts after a visit elsewhere", async ({
  page,
}) => {
  await allowSoftwareRendering(page);
  await page.goto("/");
  await stir(page);
  await expectStatus(page, "running");

  await page.getByRole("link", { name: "View projects" }).click();
  await expect(page).toHaveURL(/\/projects$/);

  await page.goBack();
  await stir(page);
  await expectStatus(page, "running");
  await expect(page.locator("[data-nebula] canvas")).toHaveCount(1);
});
