// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Mid-bosses', () => {
  test.beforeEach(async ({ game }) => {
    await game.open();
    await game.startSandbox();
  });

  const bosses = [
    { type: 'boss', name: 'HEXARCH' },
    { type: 'gemini', name: 'GEMINI' },
    { type: 'well', name: 'SINGULARITY' },
  ];
  for (const b of bosses) {
    test(`${b.name} spawns, shows its health bar, and drops a relic chest when destroyed`, async ({ game, page }) => {
      await game.act((T, type) => { T.state.bossN = 1; T.spawnMidBoss(type); }, b.type);
      await expect(page.locator('#bossname')).toHaveText(b.name);
      await expect(page.locator('#bossbar')).toBeVisible();

      // Gemini is two bodies: keep killing whichever one is the current boss
      await game.act((T) => {
        for (let i = 0; i < 2 && T.state.boss; i++) T.kill(T.state.boss);
      });
      const after = await game.read((T) => ({
        boss: !!T.state.boss,
        kills: T.state.bossKills,
        chests: T.state.gems.filter((g) => g.chest).length + T.state.pendingChest,
      }));
      expect(after.boss).toBe(false);
      expect(after.kills).toBe(1);
      expect(after.chests).toBe(1);
      await expect(page.locator('#bossbar')).toBeHidden();
    });
  }

  test('killing one Gemini twin sends the other berserk, and the pair counts once in the codex', async ({ game }) => {
    await game.act((T) => { T.state.bossN = 1; T.spawnMidBoss('gemini'); T.kill(T.state.boss); });
    const mid = await game.read((T) => ({ type: T.state.boss && T.state.boss.type, berserk: T.state.boss && T.state.boss.berserk, kills: T.state.bossKills }));
    expect(mid).toEqual({ type: 'gemini', berserk: true, kills: 0 });

    await game.act((T) => T.kill(T.state.boss));
    expect(await game.read((T) => T.meta.seen.gemini)).toBe(1);
  });

  test('the Gemini tether is telegraphed before it fires', async ({ game }) => {
    await game.act((T) => { T.state.bossN = 1; T.spawnMidBoss('gemini'); T.state.tetherT = 0.05; });
    await expect.poll(() => game.read((T) => !!T.state.tether)).toBe(true);
    const warn = await game.read((T) => T.state.tether.warn);
    expect(warn, 'there should be a warning window before the laser goes live').toBeGreaterThan(0.4);
  });

  test('the Singularity pulls the player toward it', async ({ game, page }) => {
    const startX = await game.act((T) => {
      const S = T.state;
      T.spawnMidBoss('well');
      S.boss.x = S.p.x + 500; S.boss.y = S.p.y;
      S.boss.spd = 0; S.boss.fireT = S.boss.specT = S.boss.sumT = 1e9; // freeze it so only the pull moves anything
      return S.p.x;
    });
    await page.waitForTimeout(1500);
    const moved = (await game.read((T) => T.state.p.x)) - startX;
    expect(moved, 'the player should drift toward the Singularity without any input').toBeGreaterThan(40);
  });
});
