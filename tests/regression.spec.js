// @ts-check
// Bugs found while playtesting. Each test fails on the version that had the bug.
const { test, expect } = require('./fixtures');

test.describe('Regressions', () => {
  test.beforeEach(async ({ game }) => {
    await game.open();
    await game.startSandbox();
  });

  // Bug: when you ran away from a Hexarch, it fell more than 1300 units behind and was teleported to a
  // random spot around you, so its edge marker jumped to a different side of the screen.
  test('the boss marker stays on the side the boss is on while you flee from it', async ({ game, page }) => {
    await game.act((T) => {
      const S = T.state;
      T.spawnMidBoss('boss');
      S.boss.x = S.p.x - 900; S.boss.y = S.p.y;
      S.boss.ringT = S.boss.dashCd = 1e9; // no bullet rings or charges, just the chase
      T.markers.length = 0;
    });

    // flee right, dashing as often as possible
    await page.keyboard.down('d');
    for (let i = 0; i < 14; i++) {
      await page.waitForTimeout(400);
      await page.keyboard.press('Space');
    }
    await page.keyboard.up('d');

    const { markers, width } = await game.read((T) => ({ markers: T.markers.filter((m) => m.label === 'HEXARCH'), width: innerWidth }));
    expect(markers.length, 'the boss should have been off screen for most of the chase').toBeGreaterThan(60);
    for (const m of markers) {
      expect(m.x, 'the boss is behind you, so its marker belongs on the left half').toBeLessThan(width / 2);
    }
    for (let i = 1; i < markers.length; i++) {
      const a = markers[i - 1], b = markers[i];
      if (b.t - a.t > 60) continue; // the boss was on screen in between, so no marker was drawn
      expect(Math.hypot(b.x - a.x, b.y - a.y), 'the marker jumped between two frames').toBeLessThan(80);
    }
  });

  // Bug: killing a mid-boss just before the next one was due made the next one spawn straight away.
  test('a late mid-boss kill never chains straight into the next one', async ({ game }) => {
    const r = await game.act((T) => {
      const S = T.state;
      S.bossN = 1; T.spawnMidBoss('boss');
      S.nextBoss = S.t + 1;
      T.kill(S.boss);
      return { t: S.t, next: S.nextBoss };
    });
    expect(r.next - r.t).toBeGreaterThanOrEqual(15);
  });

  // Bug: Tractor Field (pickup range) was offered on Normal, where experience flies to you anyway.
  test('Tractor Field is never offered on Normal, but is on Hard', async ({ game }) => {
    const offered = await game.act((T) => {
      const count = (diff) => {
        T.meta.diff = diff; T.start();
        let n = 0;
        for (let i = 0; i < 400; i++) if (T.rollUpgrades().some((u) => u.id === 'magnet')) n++;
        return n;
      };
      return { normal: count('normal'), hard: count('hard') };
    });
    expect(offered.normal).toBe(0);
    expect(offered.hard).toBeGreaterThan(0);
  });
});
