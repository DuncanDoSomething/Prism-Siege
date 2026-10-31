// @ts-check
// Shared setup for every test:
//  - `game` opens Prism Siege with a clean save and the test hook switched on (?test)
//  - every test fails if the page throws or logs a console error
const { test: base, expect } = require('@playwright/test');

// Mark every first-time tip as seen, so tip pop-ups never cover what a test is looking at.
const SEEN_TIPS = Object.fromEntries(
  ['move', 'hardpick', 'dash', 'refract', 'level', 'near', 'elite', 'boss', 'chest', 'final', 'collapse'].map((k) => [k, true]),
);

class Game {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /**
   * Open the game with a prepared save.
   * @param {{ meta?: object, storage?: Record<string,string>, testHook?: boolean }} [opts]
   *  - meta: fields merged into a fresh save (Light, unlocks, difficulty, ...)
   *  - storage: raw localStorage entries, for testing old or broken saves
   *  - testHook: open with ?test so window.PrismTest exists (default true)
   */
  async open({ meta = {}, storage, testHook = true } = {}) {
    const entries = storage ?? { ps_meta: JSON.stringify({ tips: SEEN_TIPS, ...meta }) };
    // Seed storage once per tab, so a later page.reload() keeps whatever the game saved.
    await this.page.addInitScript((data) => {
      if (sessionStorage.getItem('ps-seeded')) return;
      sessionStorage.setItem('ps-seeded', '1');
      localStorage.clear();
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
    }, entries);
    await this.page.goto(testHook ? '/?test' : '/');
    await expect(this.page.locator('#playbtn')).toBeVisible();
  }

  /** Start a run straight away, optionally changing the save first (ship, weapon, arena, diff). */
  async startRun(meta = {}) {
    await this.page.evaluate((m) => {
      Object.assign(window.PrismTest.meta, m);
      window.PrismTest.start();
    }, meta);
    await expect(this.page.locator('#hud')).toBeVisible();
  }

  /** Start a run where nothing spawns on its own and the player can't die. */
  async startSandbox(meta = {}) {
    await this.startRun(meta);
    await this.page.evaluate(() => {
      const T = window.PrismTest;
      T.god();
      T.calm();
      T.noLevelUps();
    });
  }

  /** Read a value from the game. The function runs in the browser and gets window.PrismTest. */
  read(fn, arg) {
    return this.page.evaluate(
      ([src, a]) => new Function('T', 'arg', `return (${src})(T, arg);`)(window.PrismTest, a),
      [fn.toString(), arg],
    );
  }

  /** Same as read(), named for calls that change the game. */
  act(fn, arg) {
    return this.read(fn, arg);
  }
}

const test = base.extend({
  pageErrors: [
    async ({ page }, use) => {
      /** @type {string[]} */
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await use(errors);
      expect(errors, 'the page threw or logged errors').toEqual([]);
    },
    { auto: true },
  ],

  game: async ({ page }, use) => {
    // Keep the suite offline and fast: answer the Google Fonts request with an empty stylesheet.
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
    );
    await use(new Game(page));
  },
});

module.exports = { test, expect, SEEN_TIPS };
