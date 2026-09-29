# Diablo: Gothic Action RPG (PixiJS v8)

A classic dark fantasy Action Role-Playing Game inspired by the 1996 masterpiece *Diablo*, built with **PixiJS (v8)**, **TypeScript**, and **Vite**.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![PixiJS](https://img.shields.io/badge/PixiJS-8.21-e91e63?logo=pixijs)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite)
![Vitest](https://img.shields.io/badge/Vitest-3.0-green?logo=vitest)

---

## ⚔️ Key Features

- **Isometric 2:1 Dimetric Engine**: Precise coordinate translation between screen space and isometric tile space with deterministic `zIndex` depth sorting and smooth camera tracking with screen shake impacts.
- **Procedural Pixel-Art Generation**: Zero external image dependencies. Cathedral flagstones, walls, pillars, doors, urns, sarcophagi, stairs, directional Warrior animations, monsters, and UI bezels are rendered procedurally into Pixi Textures at startup.
- **Atmospheric Cathedral Dungeons & Darkness**: Multi-room procedural crypt layouts with connecting corridors, interactive doors, destructible urns, and descent stairs leading to **Cathedral Level 2**.
- **Dynamic Light Radius & Shroud**: Recursive raycasting line-of-sight system, dynamic player light radius with cosine falloff and torch flickering, plus a retro wireframe **Automap** (`Tab`).
- **Authentic Diablo 1 Combat Mechanics**:
  - Exact To-Hit formula:
    $$\text{HitChance} = \text{clamp}\left(50 + \text{PlayerToHit} + \frac{\text{PlayerDex}}{2} - \text{TargetAC},\; 5\%,\; 95\%\right)$$
  - Dexterity-based shield blocking (100% physical damage absorption).
  - Visceral **Hit-Recovery stun** interrupting actions on heavy hits ($\ge 15\%$ max HP).
- **Monster Pack AI**:
  - *Skeletons*: Relentless melee pursuit with scimitars.
  - *Skeleton Archers*: Keep distance, shoot bone arrows, and kite if cornered.
  - *Fallen Imps*: Swarm in packs; panic and flee in terror when a comrade is slain.
  - *The Butcher (Unique Boss)*: Fast charge, terrifying roar (*"Ah, fresh meat!"*), heavy damage, and drops *The Butcher's Cleaver*.
- **Grid-Based Inventory ("Item Tetris")**:
  - 10x4 spatial storage grid supporting multi-cell items (1x1, 1x2, 2x2, 2x3).
  - Equipment Paperdoll: Head, Torso, Main Hand, Off Hand, Amulet, and 2 Rings.
  - 1–4 quick Belt hotbar for potions and scrolls.
  - Magic affixes (*King's*, *Godly*, *of the Whale*, *of Light*) and unidentified item state.
- **Town of Tristram Hub**:
  - Cast a Town Portal scroll to visit Tristram.
  - **Deckard Cain**: Identifies magical items for 100 gold.
  - **Pepin the Healer**: Restores full Health and Mana for free.
  - **Griswold**: Trades potions, portal scrolls, and weapons.
  - Portal returns player straight back to the dungeon floor.
- **Dual-Mode Web Audio Synthesizer**:
  - Built-in procedural Web Audio engine: dark minor cathedral drones, blade whooshes, flesh impacts, metallic shield blocks, bone clatters, potion gulps, coin clinks, and level-up chimes.
  - Drop-in extensible for custom audio files in `public/audio/`.

---

## 🕹️ Controls

| Key / Input | Action |
| :--- | :--- |
| **Left Click** | Move to tile / Attack targeted monster / Interact with doors & chests |
| **Shift + Left Click** | Attack in place (stand ground) in facing direction |
| **W, A, S, D** / Arrows | Optional direct keyboard movement |
| **1, 2, 3, 4** | Drink Belt Potions or use Town Portal Scroll |
| **I** | Toggle Inventory & Equipment Paperdoll |
| **C** | Toggle Character Attributes & Stat Point Allocation |
| **Tab** | Toggle Classic Wireframe Automap |
| **Escape** | Close open modals / deselect |

---

## 🛠️ Development & Building

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```

### Run Unit Tests
```bash
npm run test
```

### Build for Production
```bash
npm run build
```

---

## 📜 License
MIT License.
