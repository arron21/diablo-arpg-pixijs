# Changelog

All notable changes to the **Diablo: Gothic Action RPG (PixiJS)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.2.4] - 2026-09-30

### Added
- **'J' Attack Hotkey**: Added keyboard attack binding on `J`. Pressing `J` performs a melee attack aiming towards the mouse cursor, targeting hovered enemies or the closest monster in melee reach.
- **Continuous Attack on Hold**: Holding `J` down executes repeated swings through the game ticker loop, allowing continuous melee combat without rapid mouse clicking.
- **Melee Cleave on Breakable Props**: Empty swings within 1.5 tiles of urns or sarcophagi automatically break them, dropping loot and playing shatter sounds.
- **Controls Documentation**: Updated `README.md` controls table with the `J` attack key.

---

## [1.2.3] - 2026-09-30

### Fixed
- **Held Item Mouse Event Passthrough**: Added `eventMode = 'none'` and `interactiveChildren = false` to `heldItemSprite` in `InventoryView.ts`. Because the held item follows the cursor, PixiJS's default hit-testing intercepted subsequent clicks, preventing underlying inventory grid cells and paperdoll equipment slots from receiving drop events.
- **Dropping Items on Ground**: Updated world click detection in `main.ts` so clicking outside the inventory panel while holding an item drops it onto the dungeon floor at the player's feet or clicked tile, accompanied by floating text feedback (`Dropped <Item>`) and sound effects.
- **Immediate Auto-Pickup Prevention**: Added a 3-second pickup cooldown (`canPickupAfter`) to player-dropped items in `GroundItemManager.ts`, preventing the continuous proximity auto-pickup loop from vacuuming dropped items back up instantly while the player is standing over them.
- **Paperdoll Re-equipping and Swapping**: Isolated paperdoll child sprites (`spr.eventMode = 'none'`) and defined explicit rectangular hit areas (`Rectangle(0, 0, w, h)`) on all paperdoll slots, enabling seamless re-equipping and swapping of helms, armor, weapons, shields, amulets, and rings.
- **Held Item Retention on Modal Close**: Added `returnHeldItem()` and integrated clean `close()` lifecycles for `InventoryView` and `CharacterSheetView`. Closing the inventory via `Escape`, `I`, `[X]`, or opening the character sheet returns held items to the bag or drops them at the player's feet if full.
- **Flaky Combat Test**: Mocked `Math.random()` with `vi.spyOn` in `CombatEngine.test.ts` to ensure 100% deterministic test suite execution.

### Added
- **Multi-Cell Grid Swap Ergonomics**: Clicking anywhere on an occupied multi-cell item in the inventory bag now tests placement at the target item's origin, enabling effortless item swapping without requiring precise top-left cell clicking.
- **Right-Click Quick Actions**: Added right-click support in `InventoryView.ts` to drink health/mana potions directly from the bag, quick-equip items from bag to paperdoll, and quick-unequip items from paperdoll to bag.
- **Manual Ground Item Click Pickup**: Clicking on or near a ground item now directly picks it up if in range or pathfinds to it and clears cooldown.
- **Unit Test Coverage**: Created `src/items/EquipmentAndGround.test.ts` verifying `EquipmentDoll` slot restrictions/swaps and `GroundItemManager` cooldown filtering.

---

## [1.2.2] - 2026-09-30

### Fixed
- **Inventory Item Tooltip Hover Flicker**: Resolved an issue where item detail tooltips were positioned directly over the hovered item and cell. The tooltip container now has `eventMode = 'none'` and `interactiveChildren = false` to prevent mouse event interception.
- **Side Popup Positioning**: Updated `showTooltip` in `InventoryView.ts` to calculate the item's true bounding box across multi-cell items (1x1, 1x2, 2x2, 2x3) and position the details popup strictly adjacent to the item (right or left), never overlapping the hovered item.
- **Dynamic Tooltip Box Sizing**: Tooltip background box now dynamically expands to fit all stat lines, with quality-coded glowing borders (Gold for Unique, Blue for Magic, Bronze for Normal).

---

## [1.2.1] - 2026-09-30

### Fixed
- **Tab Key Browser Interception**: Resolved an issue where pressing `Tab` to open the Automap allowed the browser to perform its default focus cycling behavior instead of toggling the map. Key event handlers in `InputManager.ts` now run in the capture phase and call `preventDefault()` and `stopPropagation()` on `Tab`, `Space`, and Arrow keys.
- **Canvas Focus Maintenance**: Added `tabIndex = 0` and pointer-down focus handler to the game canvas to ensure seamless keyboard focus.
- **Automap Rendering Optimization**: Batched all wireframe wall and door drawing routines in `Automap.ts`, eliminating thousands of redundant stroke passes per frame and brightening map lines for high visibility.
- **Automap Audio Feedback**: Added sound effect trigger on opening and closing the automap.

---

## [1.2.0] - 2026-09-30

### Added
- **Official PixiJS Skills Suite**: Installed 26 specialized PixiJS skills (`.agents/skills/` and `skills-lock.json`) via `npx skills add https://github.com/pixijs/pixijs-skills`, providing specialized tool definitions for PixiJS v8 architecture, rendering, shaders, filters, blend modes, performance optimization, and particle containers.

---

## [1.1.0] - 2026-09-30

### Added
- **Automated GitHub Pages Deployment**: Added GitHub Actions workflow (`.github/workflows/deploy.yml`) to automatically test, build, and deploy the game on every push to the `main` branch.
- **Live Playable URL**: Published live browser build at [https://arron21.github.io/diablo-arpg-pixijs/](https://arron21.github.io/diablo-arpg-pixijs/).
- **CI/CD Badge**: Added live deployment status badge and play link to `README.md`.
- **Project Changelog**: Created `CHANGELOG.md` to persistently document all updates, bug fixes, and features.

### Changed
- **Relative Asset Paths**: Configured `base: './'` in `vite.config.ts` so production assets resolve relatively across GitHub Pages subpaths and custom domains.

---

## [1.0.1] - 2026-09-29

### Changed
- **Minimum 3-Square Hallway Width**: Overhauled dungeon corridor generation in `src/world/DungeonGenerator.ts` to ensure all hallways are strictly at least 3 squares wide always (`cy - 1`, `cy`, `cy + 1` horizontally and `cx - 1`, `cx`, `cx + 1` vertically).
- **Seamless 3x3 Corridor Turns**: Added $3\times3$ tile junction carving at corridor elbows to prevent narrowing or pinching at corner turns.

### Added
- **Hallway Width Unit Test**: Added automated Vitest assertion in `src/world/DungeonGenerator.test.ts` verifying all non-room corridor floor tiles maintain a width of at least 3 tiles in either axis.

---

## [1.0.0] - 2026-09-29

### Added
- **Core Isometric Engine**:
  - 2:1 dimetric projection math (`IsoMath.ts`) converting between continuous screen coordinates and discrete grid tiles.
  - Deterministic depth sorting (`zIndex = (gx + gy) * 100 + sublayer`) ensuring walls, props, monsters, and characters occlude background terrain properly.
  - Camera tracking with smooth interpolation and screen shake on critical hits and boss attacks (`Camera.ts`).
  - Layer hierarchy (`LayerManager.ts`) with dedicated containers for floors, world objects, entities, lighting, combat FX, and HUD.
- **Procedural Pixel-Art Asset Generator (`AssetFactory.ts`)**:
  - 100% self-contained offscreen canvas procedural sprite generator requiring zero external image files.
  - Cathedral stone flagstones, cracked stones, blood stains, and ornate crimson carpet runners.
  - Isometric North and West walls, corner pillars, archways, and opening/closing doors.
  - Interactive props: Sarcophagi, breakable clay urns, torch sconces, descent stairs, and town portals.
  - 8-directional animated sprites for the Warrior (Idle, Walk, Attack, Shield Block, Hit Recovery, Death).
  - Monster sprites for Skeletons, Skeleton Archers, Fallen Imps, and The Butcher.
  - Multi-cell item icons for weapons, shields, armor, potions, scrolls, and gold stacks.
  - Gothic UI frames, bubbling Life and Mana globes, and inventory grid cells.
- **Cathedral Dungeons & Dynamic Lighting**:
  - Multi-room procedural generation with connecting corridors, descent staircases, and Level 2 Butcher's Lair.
  - 8-directional A* grid pathfinding (`Pathfinding.ts`) with corner-cut protection.
  - Recursive shadowcasting Fog of War (`FogOfWar.ts`) with player Light Radius, torch flicker, and 25% visited shroud.
  - Wireframe Automap overlay (`Automap.ts`) toggled with `Tab`.
- **Combat Engine & Monster AI**:
  - Diablo 1 To-Hit formula: $\text{HitChance} = \text{clamp}(50 + \text{ToHit} + \text{Dex}/2 - \text{TargetAC},\; 5\%,\; 95\%)$.
  - Dexterity-based shield block rating: blocks completely absorb physical damage with a metallic clink.
  - Visceral Hit-Recovery stun: heavy attacks dealing $\ge 15\%$ max HP interrupt current actions.
  - Monster pack AI: Skeletons swarm; Archers kite; Fallen Ones panic on pack member death; The Butcher charges at 4.6 tiles/sec, roars *"Ah, fresh meat!"*, and drops *The Butcher's Cleaver*.
- **Item Tetris & Progression**:
  - 10x4 spatial storage grid (`InventoryGrid.ts`) for 1x1, 1x2, 2x2, and 2x3 items with gold stack auto-merging up to 5,000.
  - Equipment Paperdoll (`EquipmentDoll.ts`): Head, Torso, Main Hand, Off Hand, Amulet, and 2 Rings.
  - 1–4 quick Belt hotbar (`Belt.ts`) for rapid potion consumption.
  - Magic affix generator (`AffixGenerator.ts`) rolling prefixes (*King's*, *Godly*) and suffixes (*of the Whale*, *of Light*).
  - Town Portal to Tristram Hub (`TristramHub.ts`): Deckard Cain (identifying items), Pepin (healing), Griswold (trading).
- **Dual-Mode Web Audio Synthesizer (`SoundManager.ts`)**:
  - Procedural Web Audio engine producing ambient minor cathedral drones, blade swings, bone crunches, shield blocks, potion gulps, coin clinks, and level-up chimes.
- **Automated Test Suite**:
  - 10 unit tests verifying isometric coordinates, combat math, dungeon connectivity, and inventory grid collision.
