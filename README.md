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
| `ui.js` | Drawing the screen, menus, party sheets, shop, settings |
| `main.js` | Start-up, controls, saving settings |
| `style.css`, `body.html` | Page layout and look |

## Tests (`tests/`)

Automated browser tests (Python + Playwright). `bot.py <class> <steps>` plays the game by itself and reports any errors; the `feat*.py` scripts exercise specific features.

## Playing

The current build is published as a Claude artifact. `dist/lantern-crawl.html` can also be opened directly in any browser.
