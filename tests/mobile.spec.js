// @ts-check
// Runs in the "mobile" project (Pixel 7 viewport with touch).
const { test, expect } = require('./fixtures');

/** True when nothing on the page sticks out past the right edge of the screen. */
async function fitsTheScreen(page) {
  return page.evaluate(() => {
    if (document.documentElement.scrollWidth > innerWidth) return false;
    const open = [...document.querySelectorAll('.ov')].find((o) => !o.hidden);
    if (!open) return true;
    // wide tables scroll inside their own box on purpose
    return [...open.querySelectorAll('*')].every((el) => el.closest('.tablewrap') || el.getBoundingClientRect().right <= innerWidth + 1);
  });
}

test.describe('Phone', () => {
  test.beforeEach(async ({ game }) => {
    await game.open();
  });

  const screens = [
    { name: 'title', open: null, overlay: '#ov-title' },
    { name: 'run setup', open: '#playbtn', overlay: '#ov-setup' },
    { name: 'Prism Lab', open: '#labbtn', overlay: '#ov-lab' },
    { name: 'codex', open: '#codexbtn', overlay: '#ov-codex' },
    { name: 'history', open: '#histbtn', overlay: '#ov-history' },
    { name: 'settings', open: '#setbtn', overlay: '#ov-settings' },
  ];
  for (const s of screens) {
    test(`the ${s.name} screen fits a phone without sideways scrolling`, async ({ page }) => {
      if (s.open) await page.tap(s.open);
      await expect(page.locator(s.overlay)).toBeVisible();
      expect(await fitsTheScreen(page)).toBe(true);
    });
  }

  test('touching the screen shows the dash button, and dragging steers the ship', async ({ game, page }) => {
    await game.startSandbox();
    const box = await page.locator('#c').boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;

    await page.touchscreen.tap(cx, cy);
    await expect(page.locator('#dashbtn')).toBeVisible();

    const startX = await game.read((T) => T.state.p.x);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 80, cy, { steps: 5 });
    await page.waitForTimeout(600);
    await page.mouse.up();
    expect((await game.read((T) => T.state.p.x)) - startX, 'dragging right should move the ship right').toBeGreaterThan(50);
  });
});
