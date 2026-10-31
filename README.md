# Prism Siege

[![Tests](https://github.com/DuncanDoSomething/Prism-Siege/actions/workflows/tests.yml/badge.svg)](https://github.com/DuncanDoSomething/Prism-Siege/actions/workflows/tests.yml)

**A neon arena survivor where every kill refracts your shot into coloured shards that keep hunting.**

### ▶ [Play it in your browser](https://duncandosomething.github.io/Prism-Siege/)

![Prism Siege gameplay: refracting shots tearing through a swarm](docs/gameplay.png)

Your ship fires on its own. You steer, dash through danger and decide what your ship turns into. Survive five minutes, break the mid-bosses, chain huge combos and destroy the White Light.

---

## About this project

Prism Siege is a **vibe-coding experiment**: I wanted to see how far I could take a game by building it together with [Claude](https://claude.ai), Anthropic's AI assistant. Claude wrote the code and made most of the design calls. I directed the project, playtested every version and turned what I found into feedback for the next round.

A lot of the game came straight out of those playtests:

- **Normal and Hard modes.** Picking up experience while the screen is full felt too punishing, so Normal now collects it for you, and pickup upgrades only appear in Hard.
- **Near-miss effect.** Barely dodging something should feel great, so it now triggers a short slow-motion, a chromatic split of the ship and a dash refund.
- **A combo meter that grows with you.** The combo counter was easy to miss, so it became a tiered meter that rewards you for keeping it alive.
- **Five-minute runs and steeper scaling.** Ten-minute runs got comfortable after minute four, so the run got shorter and enemies scale harder.
- **Boss indicators.** Bosses were hard to find in the open arena, so they now spawn closer and get a marker with their distance on the screen edge.
- **Bug reports.** For example, the boss marker jumped around the screen when you ran away from a boss. The boss was being teleported to a random spot, and now it follows you along the same line.

## Features

- **Refraction.** Killing blows split your shot into shards that keep flying, and upgrades let those shards split again.
- **4 weapons:** Prism Blaster, Scatter Cannon, Prism Beam and Seeker Pods.
- **15 upgrades and 5 secret evolutions** that unlock when two upgrades reach the right level.
- **12 relics** from boss chests, several of them built around near misses.
- **3 rotating mid-bosses** (Hexarch, Gemini and Singularity) and a three-phase final boss, the White Light.
- **8 enemy types and 4 elite traits** (Shielded, Swift, Volatile, Brood).
- **3 arenas:** The Void, Mirror Hall (your shots bounce off the walls) and Collapse (a shrinking safe zone).
- **Meta-progression.** Spend Light in the Prism Lab on permanent upgrades, ships and weapons.
- **Intensity 0–8.** Every win unlocks the next level, each with an extra modifier and more Light.
- **Procedural synthwave soundtrack** that gets heavier during boss fights.
- **Codex, run history and settings**, plus tips the first time something new happens.

![Gemini mid-boss sweeping its laser tether](docs/boss.png)

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | WASD or arrow keys | Drag anywhere |
| Dash (you can't be hit while dashing) | Space | DASH button |
| Pick an upgrade | 1, 2, 3 or click | Tap a card |
| Reroll upgrades | R | REROLL button |
| Pause | P or Esc | Pause button |
| Mute | M | Sound button |

## How it's built

- **One HTML file.** The game has no build step and no runtime dependencies: plain JavaScript on an HTML5 canvas.
- **No image or audio assets.** Every ship, enemy, boss and effect is drawn in code, and all sound effects and music are synthesised live with the Web Audio API.
- **Saves to `localStorage`.** Your Light, unlocks, codex and run history stay in your browser.
- Fonts: [Bungee](https://fonts.google.com/specimen/Bungee) and [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) from Google Fonts.

## Testing

The game has an automated end-to-end test suite built with [Playwright](https://playwright.dev). It runs on every push and pull request through GitHub Actions, on a desktop browser and an emulated phone.

| Spec | What it checks |
| --- | --- |
| `smoke` | The game loads without errors and the clock runs |
| `navigation` | Every menu opens and closes, pausing really stops time |
| `run` | A mid-boss arrives at 1:00, the White Light at 5:00, winning unlocks the next Intensity, dying is recorded in history, combo tiers pay out |
| `bosses` | Each mid-boss spawns and drops a relic chest, Gemini's twin goes berserk, the tether is telegraphed, the Singularity pulls you in |
| `combat` | All four weapons deal damage, kills refract, near misses are counted, Normal and Hard handle experience differently, enemies scale up over the run |
| `progression` | Lab purchases spend Light and survive a reload, locked items can't be picked, settings are remembered, broken or old saves still load |
| `regression` | Bugs found while playtesting stay fixed |
| `mobile` | No screen scrolls sideways on a phone, touch shows the dash button and dragging steers |

**How the tests control the game.** A game runs in real time, and nobody wants a test that waits five minutes for the final boss. When the page is opened with `?test` in the URL, it exposes a small `window.PrismTest` object. With it, tests can read the game state, jump the clock forward, spawn bosses and turn on a sandbox (no deaths, no random spawns), so each test sets up exactly the situation it checks. Normal players never get this object, and one test checks that it stays hidden without `?test`.

**Every test also fails on console errors.** A shared fixture listens for uncaught exceptions and `console.error` calls, so a test that passes its assertions but makes the game throw still fails.

**The regression tests were checked against the bugs.** Each one was run against a copy of the game with its bug put back in, to confirm it fails there and passes on the fixed version. The suite also ran three times in a row without a flaky result.

### Run the tests yourself

```bash
npm install
npx playwright install chromium
npm test            # the whole suite, headless
npm run test:ui     # Playwright's interactive UI
npm run report      # open the HTML report of the last run
```

## Run it locally

Download `index.html` and open it in a browser. That's all.

![Prism Siege title screen](docs/title.png)
