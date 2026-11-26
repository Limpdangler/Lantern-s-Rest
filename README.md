# Lantern's Rest (Lantern Crawl)

A mobile-friendly, turn-based dungeon crawler in the browser: Sword of Mana–style pixel art with D&D 5e rules (Solasta / Baldur's Gate–like tactical combat, a party of up to four, procedural floors).

## How it's put together

The game ships as **one self-contained web page** (`dist/lantern-crawl.html`). That page is assembled from the smaller source files in `src/` by `build.py`, which joins them in a fixed order. Nothing needs a server, and all the art is drawn by code.

To rebuild after editing anything in `src/`:

```
python3 build.py
```

## What each file does (`src/`)

| File | What's in it |
|---|---|
| `util.js` | Small helpers: dice rolling, random numbers, maths |
| `data.js` | **Game content**: classes, monsters, spells, items, traps, races, default settings. The safest place to tweak numbers and text |
| `sprites.js` | Old 16×16 object sprites (gold, potions, barrels, shrine…) |
| `chars.js` | Older character templates (mostly superseded) |
| `chars2.js` | The shaded JRPG-style hero/NPC drawing system, race looks, hoods |
| `mons2.js` | Shaded monster drawings (goblins, kobolds, beasts, ooze, mimic, ogre) |
| `world.js` | Floor generation (rooms, doors, monsters, loot), sight & light, pathfinding |
| `terrain.js` | Paints the walls and floors for each floor style |
| `rules.js` | Core 5e rules: ability scores, attacks, damage, saves, death, traps, fire |
| `combat.js` | Turn order, the combat panel, monster AI, spells and skills in battle |
| `explore.js` | Walking around, doors, chests, shrines, parley, stairs |
| `ex5e.js` | Searching, stealth & surprise, monster lore, light/oil, camping, corpses |
| `subs.js` | The 21 subclasses |
| `living.js` | Route choice, noise, patrols, factions, floor goals, unknown items, riddles, companions, the town |
| `dress.js` | Set dressing (skeletons, old camps, webs…) and collapsed passages |
| `classfx.js` | Class signature abilities, feats, inspiration, reactions |
| `save.js` | Saving and resuming runs (automatic) |
| `effects.js` | **The trigger system**: every class/race/subclass/feat/item effect that changes attacks or damage, each in one labelled entry |
| `social.js` | Monster surrender & questioning, calling for help, languages, haggling, Revivify, prepared spells |
| `ui.js` | Drawing the screen, menus, party sheets, shop, settings |
| `hotbar.js` | The combat hotbar (icon buttons, no sub-menus), status icons you can tap (Wild Shape, Concentration…), the ABILITIES button |
| `main.js` | Start-up, controls, saving settings |
| `style.css`, `body.html` | Page layout and look |

## Adding a new ability

Attack and damage rules don't contain any class-specific code. They announce moments ("an attack hit", "damage is about to land"…) and `src/effects.js` lists every effect that reacts to them, e.g.:

```js
effect("raceResist","Dwarf (poison) and Tiefling (fire) resistance",{damageIn:async c=>{ ... }});
```

A new ability is a new `effect(...)` entry. The top of `effects.js` lists every moment and what information it gets.

## Seeds and saves

Every run has a **dungeon seed** (shown in the menu and end screen). Typing the same seed on the town screen builds the same floors, which makes bugs easy to reproduce. Runs save automatically; the town screen offers **Continue run**.

## Tests (`tests/`)

Automated browser tests (Python + Playwright). `bot.py <class> <steps>` plays the game by itself and reports any errors; `feat*.py` exercise specific features; `save_test.py`, `seed_test.py` and `effects_test.py` check saving, seeds and the trigger system. `run_all.sh` runs the quick ones.

## Playing

- **On the web / phones:** https://limpdangler.github.io/Lantern-s-Rest/ (served from the `docs/` folder by GitHub Pages). On a phone, use *Add to Home Screen* to install it as an app that works offline.
- `build.py` writes both `dist/lantern-crawl.html` (single file, also published as a Claude artifact) and `docs/` (the phone-installable version: `index.html`, `manifest.json`, `sw.js` for offline play, and icons).
- `tools/make_icon.py` redraws the home-screen icon; `tools/sw_template.js` is the offline helper (its version updates automatically on every build).
