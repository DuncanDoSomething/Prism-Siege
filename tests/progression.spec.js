// @ts-check
const { test, expect, SEEN_TIPS } = require('./fixtures');

test.describe('Saves and progression', () => {
  test('buying a Lab upgrade spends Light and survives a reload', async ({ game, page }) => {
    await game.open({ meta: { light: 500 } });
    await page.click('#labbtn');
    await page.click('#buy-hull');
    expect(await game.read((T) => ({ light: T.meta.light, hull: T.meta.lab.hull }))).toEqual({ light: 470, hull: 1 });

    await page.reload();
    await expect(page.locator('#playbtn')).toBeVisible();
    expect(await game.read((T) => ({ light: T.meta.light, hull: T.meta.lab.hull }))).toEqual({ light: 470, hull: 1 });
  });

  test('a Lab upgrade can not be bought without enough Light', async ({ game, page }) => {
    await game.open({ meta: { light: 10 } });
    await page.click('#labbtn');
    await expect(page.locator('#buy-hull')).toBeDisabled();
  });

  test('a bought weapon becomes selectable in run setup and is used in the run', async ({ game, page }) => {
    await game.open({ meta: { light: 500 } });
    await page.click('#labbtn');
    await page.click('#weapon-buy-scatter');
    await page.click('#labback');
    await page.click('#playbtn');
    await expect(page.locator('#weapon-scatter')).toBeEnabled();
    await expect(page.locator('#weapon-scatter')).toHaveAttribute('aria-pressed', 'true');
    await page.click('#launchbtn');
    expect(await game.read((T) => T.state.weapon)).toBe('scatter');
  });

  test('locked ships and weapons can not be picked', async ({ game, page }) => {
    await game.open();
    await page.click('#playbtn');
    await expect(page.locator('#ship-glint')).toBeDisabled();
    await expect(page.locator('#weapon-seeker')).toBeDisabled();
  });

  test('settings are remembered', async ({ game, page }) => {
    await game.open();
    await page.click('#setbtn');
    await page.uncheck('#set-dmg');
    await page.click('#setback');
    await page.reload();
    await expect(page.locator('#playbtn')).toBeVisible();
    expect(await game.read((T) => T.meta.settings.dmgNums)).toBe(false);
  });

  test('a corrupted save does not break the game', async ({ game, page }) => {
    await game.open({ storage: { ps_meta: '{this is not json' } });
    await page.click('#playbtn');
    await page.click('#launchbtn');
    await expect(page.locator('#hud')).toBeVisible();
  });

  test('a best score from the very first version is kept as the Hard best', async ({ game }) => {
    await game.open({ storage: { ps_best: JSON.stringify({ score: 12345, time: 200 }), ps_meta: JSON.stringify({ tips: SEEN_TIPS }) } });
    expect(await game.read((T) => T.meta.best.hard)).toEqual({ score: 12345, time: 200 });
  });
});
