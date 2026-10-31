// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Run structure', () => {
  test.beforeEach(async ({ game }) => {
    await game.open();
  });

  test('a mid-boss arrives at 1:00', async ({ game, page }) => {
    await game.startRun();
    await game.act((T) => { T.god(); T.noLevelUps(); T.state.t = 59.5; });
    await expect.poll(() => game.read((T) => T.state.boss && T.state.boss.type)).toMatch(/^(boss|gemini|well)$/);
    await expect(page.locator('#bossbar')).toBeVisible();
    await expect(page.locator('#bossname')).toHaveText(/^(HEXARCH|GEMINI|SINGULARITY)$/);
  });

  test('every run puts all three mid-bosses in its first three slots, in a shuffled order', async ({ game }) => {
    const orders = await game.read((T) => {
      const out = [];
      for (let i = 0; i < 30; i++) { T.start(); out.push(T.state.bossOrder.slice()); }
      return out;
    });
    for (const o of orders) expect([...o.slice(0, 3)].sort()).toEqual(['boss', 'gemini', 'well']);
    const firsts = new Set(orders.map((o) => o[0]));
    expect(firsts.size, 'the first boss should not always be the same').toBeGreaterThan(1);
  });

  test('the White Light arrives at 5:00', async ({ game, page }) => {
    await game.startSandbox();
    const run = await game.read((T) => T.RUN);
    expect(run).toBe(300);
    await game.act((T) => { T.state.t = T.RUN - 0.5; });
    await expect.poll(() => game.read((T) => !!T.state.final)).toBe(true);
    await expect(page.locator('#bossname')).toHaveText('WHITE LIGHT');
    await expect(page.locator('#goal')).toHaveText('DESTROY THE WHITE LIGHT');
  });

  test('destroying the White Light wins the run and unlocks Intensity 1', async ({ game, page }) => {
    await game.startSandbox();
    await game.act((T) => { T.state.t = T.RUN - 0.5; });
    await expect.poll(() => game.read((T) => !!T.state.final)).toBe(true);
    await game.act((T) => T.kill(T.state.final));

    await expect(page.locator('#ov-over')).toBeVisible({ timeout: 6_000 });
    await expect(page.locator('#o-title')).toHaveText('VICTORY');
    await expect(page.locator('#o-unlock')).toHaveText('INTENSITY 1 UNLOCKED ON NORMAL');
    const meta = await game.read((T) => ({ wins: T.meta.wins, maxInt: T.meta.maxInt.normal, last: T.meta.history[0] }));
    expect(meta.wins).toBe(1);
    expect(meta.maxInt).toBe(1);
    expect(meta.last.won).toBe(true);
  });

  test('dying ends the run, pays out Light and records it in history', async ({ game, page }) => {
    await game.startRun();
    await game.act((T) => { T.calm(); T.state.t = 60; T.state.p.hp = 1; T.state.p.inv = 0; T.hurt(50); });

    await expect(page.locator('#ov-over')).toBeVisible();
    await expect(page.locator('#o-title')).toHaveText('GAME OVER');
    const meta = await game.read((T) => ({ light: T.meta.light, runs: T.meta.runs, hist: T.meta.history.length, won: T.meta.history[0].won }));
    expect(meta.light).toBeGreaterThan(0);
    expect(meta.runs).toBe(1);
    expect(meta.hist).toBe(1);
    expect(meta.won).toBe(false);

    await page.click('#overtitlebtn');
    await page.click('#histbtn');
    await expect(page.locator('#histtable tbody tr')).toHaveCount(1);
  });

  test('a new combo tier pays out a bonus and refills a dash charge', async ({ game, page }) => {
    await game.startSandbox();
    const before = await game.act((T) => {
      const S = T.state;
      S.p.charges = 0; S.p.dashCd = 99;
      const score = S.score;
      for (let i = 0; i < 10; i++) T.kill(T.spawnEnemy('drone', S.p.x + 300, S.p.y));
      return score;
    });
    const after = await game.read((T) => ({ combo: T.state.combo, tier: T.state.comboTier, charges: T.state.p.charges, score: T.state.score }));
    expect(after.combo).toBe(10);
    expect(after.tier).toBe(0);
    expect(after.charges).toBe(1);
    expect(after.score - before).toBeGreaterThanOrEqual(500);
    await expect(page.locator('#ctier')).toHaveText('NICE');
  });
});
