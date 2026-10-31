// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Menus and navigation', () => {
  test.beforeEach(async ({ game }) => {
    await game.open();
  });

  test('Play opens run setup, and Launch starts a run', async ({ game, page }) => {
    await page.click('#playbtn');
    await expect(page.locator('#ov-setup')).toBeVisible();
    await page.click('#launchbtn');
    await expect(page.locator('#ov-setup')).toBeHidden();
    await expect(page.locator('#hud')).toBeVisible();
    expect(await game.read((T) => T.mode)).toBe('play');
  });

  const menus = [
    { name: 'Prism Lab', open: '#labbtn', overlay: '#ov-lab', back: '#labback' },
    { name: 'Codex', open: '#codexbtn', overlay: '#ov-codex', back: '#codexback' },
    { name: 'History', open: '#histbtn', overlay: '#ov-history', back: '#histback' },
    { name: 'Settings', open: '#setbtn', overlay: '#ov-settings', back: '#setback' },
    { name: 'Run setup', open: '#playbtn', overlay: '#ov-setup', back: '#setupback' },
  ];
  for (const m of menus) {
    test(`${m.name} opens and Back returns to the title`, async ({ page }) => {
      await page.click(m.open);
      await expect(page.locator(m.overlay)).toBeVisible();
      await expect(page.locator('#ov-title')).toBeHidden();
      await page.click(m.back);
      await expect(page.locator(m.overlay)).toBeHidden();
      await expect(page.locator('#ov-title')).toBeVisible();
    });
  }

  test('Escape pauses and resumes a run', async ({ game, page }) => {
    await game.startRun();
    await page.keyboard.press('Escape');
    await expect(page.locator('#ov-pause')).toBeVisible();
    const pausedAt = await game.read((T) => T.state.t);
    await page.waitForTimeout(500);
    expect(await game.read((T) => T.state.t), 'the clock keeps running while paused').toBe(pausedAt);
    await page.keyboard.press('Escape');
    await expect(page.locator('#ov-pause')).toBeHidden();
    await expect.poll(() => game.read((T) => T.state.t)).toBeGreaterThan(pausedAt);
  });

  test('Title from the pause menu ends the run and shows the title screen', async ({ game, page }) => {
    await game.startRun();
    await page.keyboard.press('p');
    await page.click('#quitbtn');
    await expect(page.locator('#ov-title')).toBeVisible();
    await expect(page.locator('#hud')).toBeHidden();
  });

  test('the codex switches between its three tabs', async ({ page }) => {
    await page.click('#codexbtn');
    for (const tab of ['relics', 'evos', 'beasts']) {
      await page.click(`#tab-${tab}`);
      await expect(page.locator(`#tab-${tab}`)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#codexbody .centry').first()).toBeVisible();
    }
  });
});
