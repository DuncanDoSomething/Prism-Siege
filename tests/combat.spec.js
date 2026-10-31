// @ts-check
const { test, expect } = require('./fixtures');

const WEAPONS = [
  { id: 'blaster', source: 'Blaster' },
  { id: 'scatter', source: 'Scatter' },
  { id: 'beam', source: 'Beam' },
  { id: 'seeker', source: 'Seeker' },
];

test.describe('Weapons and combat', () => {
  test.beforeEach(async ({ game }) => {
    await game.open({ meta: { weapons: { blaster: true, scatter: true, beam: true, seeker: true } } });
  });

  for (const w of WEAPONS) {
    test(`${w.source} finds targets and deals damage`, async ({ game }) => {
      await game.startSandbox({ weapon: w.id });
      expect(await game.read((T) => T.state.weapon)).toBe(w.id);
      await game.act((T) => {
        const S = T.state;
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; T.spawnEnemy('brute', S.p.x + Math.cos(a) * 200, S.p.y + Math.sin(a) * 200); }
      });
      await expect.poll(() => game.read((T, src) => T.state.dmgBy[src] || 0, w.source)).toBeGreaterThan(0);
    });
  }

  test('kills refract into shards that damage other enemies', async ({ game }) => {
    await game.startSandbox({ weapon: 'blaster' });
    await game.act((T) => {
      const S = T.state;
      // a tight pack of fragile drones, so every kill has neighbours for its shards to hit
      for (let i = 0; i < 40; i++) {
        const e = T.spawnEnemy('drone', S.p.x + 220 + (i % 8) * 18, S.p.y - 70 + Math.floor(i / 8) * 35);
        e.hp = e.max = 1; e.spd = 0;
      }
    });
    await expect.poll(() => game.read((T) => T.state.dmgBy.Refraction || 0), { timeout: 10_000 }).toBeGreaterThan(0);
  });

  test('a near miss pays out score and is counted', async ({ game }) => {
    await game.startSandbox();
    // a slow enemy bullet that passes just over the ship
    await game.act((T) => {
      const S = T.state;
      S.p.inv = 0;
      S.ebullets.push({ x: S.p.x - 120, y: S.p.y - 26, vx: 160, vy: 0, r: 6, life: 3, dmg: 1 });
    });
    await expect.poll(() => game.read((T) => T.state.nearMisses)).toBe(1);
    expect(await game.read((T) => T.state.score)).toBeGreaterThanOrEqual(50);
  });
});

test.describe('Difficulty', () => {
  test('Normal: experience flies to you on its own', async ({ game }) => {
    await game.open({ meta: { diff: 'normal' } });
    await game.startSandbox();
    await game.act((T) => { const S = T.state; T.kill(T.spawnEnemy('brute', S.p.x + 600, S.p.y)); });
    await expect.poll(() => game.read((T) => T.state.xp)).toBeGreaterThan(0);
  });

  test('Hard: experience stays where it dropped until you collect it', async ({ game, page }) => {
    await game.open({ meta: { diff: 'hard' } });
    await game.startSandbox();
    await game.act((T) => { const S = T.state; T.kill(T.spawnEnemy('brute', S.p.x + 600, S.p.y)); });
    await page.waitForTimeout(1200);
    const s = await game.read((T) => ({ xp: T.state.xp, waiting: T.state.gems.filter((g) => !g.heal && !g.chest && !g.pull).length }));
    expect(s.xp).toBe(0);
    expect(s.waiting).toBeGreaterThan(0);
  });

  test('enemies get much tougher over the run', async ({ game }) => {
    await game.open();
    await game.startSandbox();
    const hp = await game.read((T) => {
      const at = (t) => { T.state.t = t; return T.spawnEnemy('drone').max; };
      return { start: at(0), end: at(T.RUN) };
    });
    expect(hp.end / hp.start).toBeGreaterThan(10);
  });
});
