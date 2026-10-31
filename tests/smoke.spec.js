// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Smoke', () => {
  test('the title screen loads without errors', async ({ game, page }) => {
    await game.open();
    await expect(page).toHaveTitle('Prism Siege');
    await expect(page.locator('h1')).toHaveText(/PRISM\s*SIEGE/);
    for (const id of ['#playbtn', '#labbtn', '#codexbtn', '#histbtn', '#setbtn']) {
      await expect(page.locator(id)).toBeVisible();
    }
  });

  test('the test hook only exists when the page is opened with ?test', async ({ game, page }) => {
    await game.open({ testHook: false });
    expect(await page.evaluate(() => typeof window.PrismTest)).toBe('undefined');
  });

  test('the game clock runs once a run starts', async ({ game }) => {
    await game.open();
    await game.startRun();
    await expect.poll(() => game.read((T) => T.state.t)).toBeGreaterThan(1);
  });
});
