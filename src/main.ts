import { Application } from 'pixi.js';
import { Camera } from './engine/Camera';
import { LayerManager } from './engine/LayerManager';
import { screenToGrid } from './engine/IsoMath';
import { InputManager } from './core/InputManager';
import { AssetFactory } from './graphics/AssetFactory';
import { DungeonGenerator, DungeonLevel, TileType } from './world/DungeonGenerator';
import { TilemapRenderer } from './world/TilemapRenderer';
import { Pathfinding } from './world/Pathfinding';
import { FogOfWar } from './fog/FogOfWar';
import { Automap } from './ui/Automap';
import { Player } from './entities/Player';
import { Monster, MonsterType } from './entities/Monster';
import { ActionState, Entity } from './entities/Entity';
import { CombatEngine } from './combat/CombatEngine';
import { FloatingTextManager } from './combat/FloatingText';
import { GroundItemManager } from './items/GroundItemManager';
import { SoundManager } from './audio/SoundManager';
import { GothicHUD } from './ui/GothicHUD';
import { InventoryView } from './ui/InventoryView';
import { CharacterSheetView } from './ui/CharacterSheetView';
import { TristramHub } from './town/TristramHub';
import { ItemType } from './items/ItemTypes';
import { AffixGenerator } from './items/AffixGenerator';

async function bootstrap() {
  const container = document.getElementById('game-container')!;

  // 1. Initialize PixiJS Application
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundColor: 0x050406,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });
  app.canvas.tabIndex = 0;
  app.canvas.style.outline = 'none';
  container.appendChild(app.canvas);
  app.canvas.focus();

  // 2. Generate procedural textures
  AssetFactory.init();

  // 3. Engine systems
  const layers = new LayerManager(app.stage);
  const camera = new Camera(app.screen.width, app.screen.height);
  const input = new InputManager(app.canvas);
  const sounds = new SoundManager();
  const floatingTexts = new FloatingTextManager(layers.fxLayer);
  const groundItems = new GroundItemManager(layers.entityLayer);

  // 4. World & Dungeon State
  let currentLevelNumber = 1;
  let dungeon: DungeonLevel = DungeonGenerator.generate(currentLevelNumber);
  let fog = new FogOfWar(dungeon.width, dungeon.height);
  layers.lightingLayer.addChild(fog.graphics);

  const tilemapRenderer = new TilemapRenderer(layers.floorLayer, layers.worldObjectLayer);
  tilemapRenderer.renderDungeon(dungeon);

  const automap = new Automap();
  layers.automapLayer.addChild(automap.container);

  // 5. Entities
  const player = new Player(dungeon.playerSpawn.gx, dungeon.playerSpawn.gy);
  layers.entityLayer.addChild(player.spriteContainer);
  player.onSoundTrigger = (key) => sounds.play(key);
  camera.jumpTo(player.spriteContainer.x, player.spriteContainer.y);

  let monsters: Monster[] = [];

  function spawnMonstersForDungeon() {
    // Clean old monsters
    for (const m of monsters) {
      layers.entityLayer.removeChild(m.spriteContainer);
      m.spriteContainer.destroy();
    }
    monsters = [];

    for (let i = 1; i < dungeon.rooms.length; i++) {
      const room = dungeon.rooms[i];

      if (room.isButcherRoom) {
        // Spawn The Butcher!
        const butcher = new Monster(MonsterType.BUTCHER, room.centerX, room.centerY, 3);
        butcher.onSoundTrigger = (k) => sounds.play(k);
        setupMonsterCombat(butcher);
        layers.entityLayer.addChild(butcher.spriteContainer);
        monsters.push(butcher);
        continue;
      }

      // Normal room: 2-4 monsters
      const count = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < count; j++) {
        const mx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const my = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

        const rand = Math.random();
        let mType: MonsterType = MonsterType.SKELETON;
        if (rand < 0.35) mType = MonsterType.FALLEN;
        else if (rand < 0.65) mType = MonsterType.ARCHER;

        const monster = new Monster(mType, mx, my, currentLevelNumber);
        monster.onSoundTrigger = (k) => sounds.play(k);
        setupMonsterCombat(monster);
        layers.entityLayer.addChild(monster.spriteContainer);
        monsters.push(monster);
      }
    }
  }

  function setupMonsterCombat(monster: Monster) {
    monster.onAttackHit = (target: Entity) => {
      if (target !== player || player.state === ActionState.DEAD) return;

      const result = CombatEngine.resolveAttack(monster.stats, player.stats);

      if (!result.isHit) {
        floatingTexts.spawn('Miss', player.spriteContainer.x, player.spriteContainer.y - 20, 0xaaaaaa);
      } else if (result.isBlocked) {
        player.triggerBlock();
        floatingTexts.spawn('Blocked', player.spriteContainer.x, player.spriteContainer.y - 20, 0x59a2ff);
      } else {
        player.stats.currentHp = Math.max(0, player.stats.currentHp - result.damage);
        floatingTexts.spawn(`-${result.damage}`, player.spriteContainer.x, player.spriteContainer.y - 20, 0xcc2222);
        camera.shake(4, 150);

        if (player.stats.currentHp <= 0) {
          player.state = ActionState.DEAD;
          player.updateSpriteTexture();
          sounds.play('skeleton_death');
          floatingTexts.spawn('YOU DIED', player.spriteContainer.x, player.spriteContainer.y - 40, 0xff0000);
        } else if (result.triggersHitRecovery) {
          player.triggerHitRecovery();
        } else {
          sounds.play('hit_flesh');
        }
      }
    };
  }

  spawnMonstersForDungeon();

  // Player attack hit resolution
  player.onAttackHit = (target: Entity | null) => {
    // If targeted monster
    if (target && target instanceof Monster && target.state !== ActionState.DEAD) {
      resolvePlayerHitOnMonster(target);
    } else {
      // Cleave check: hit any monster within 1.45 tiles
      let hitMonster = false;
      for (const m of monsters) {
        if (m.state !== ActionState.DEAD) {
          const dist = Math.hypot(m.gx - player.gx, m.gy - player.gy);
          if (dist <= 1.45) {
            resolvePlayerHitOnMonster(m);
            hitMonster = true;
            break;
          }
        }
      }

      // If no monster was hit, check for breakable props (urns, sarcophagi) within melee reach
      if (!hitMonster) {
        for (const prop of dungeon.props.values()) {
          if (!prop.isOpenedOrBroken) {
            const dist = Math.hypot(prop.gx - player.gx, prop.gy - player.gy);
            if (dist <= 1.5) {
              prop.isOpenedOrBroken = true;
              tilemapRenderer.updatePropBroken(prop);
              sounds.play(prop.type === TileType.URN ? 'bone_clatter' : 'item_equip');
              const drops = [
                Math.random() < 0.5 ? AffixGenerator.createHealthPotion() : AffixGenerator.createGoldPile(75)
              ];
              for (const d of drops) {
                groundItems.dropItem(d, prop.gx, prop.gy);
              }
              break;
            }
          }
        }
      }
    }
  };

  function resolvePlayerHitOnMonster(target: Monster) {
    const res = CombatEngine.resolveAttack(player.stats, target.stats);

    if (!res.isHit) {
      floatingTexts.spawn('Miss', target.spriteContainer.x, target.spriteContainer.y - 20, 0xaaaaaa);
    } else if (res.isBlocked) {
      floatingTexts.spawn('Blocked', target.spriteContainer.x, target.spriteContainer.y - 20, 0x59a2ff);
      sounds.play('shield_block');
    } else {
      target.stats.currentHp = Math.max(0, target.stats.currentHp - res.damage);
      floatingTexts.spawn(`${res.damage}`, target.spriteContainer.x, target.spriteContainer.y - 20, 0xffea33);
      camera.shake(res.damage > 12 ? 6 : 3, 160);

      if (target.stats.currentHp <= 0) {
        // Monster killed!
        const drops = target.die();
        for (const drop of drops) {
          groundItems.dropItem(drop, target.gx, target.gy);
        }

        // Grant XP
        if (player.addExperience(target.xpReward)) {
          floatingTexts.spawn('LEVEL UP!', player.spriteContainer.x, player.spriteContainer.y - 40, 0xd4af37);
        }
        floatingTexts.spawn(`+${target.xpReward} XP`, target.spriteContainer.x, target.spriteContainer.y - 15, 0xd4af37);

        // If killed a Fallen, make pack panic!
        if (target.monsterType === MonsterType.FALLEN) {
          for (const other of monsters) {
            if (other !== target && other.monsterType === MonsterType.FALLEN) {
              const d = Math.hypot(other.gx - target.gx, other.gy - target.gy);
              if (d <= 6.0) {
                other.triggerPanic();
              }
            }
          }
        }
      } else if (res.triggersHitRecovery) {
        target.triggerHitRecovery();
      } else {
        sounds.play(target.monsterType === MonsterType.SKELETON ? 'bone_clatter' : 'hit_flesh');
      }
    }
  }

  // 6. UI Screens & Modals
  let inventoryView: InventoryView;
  let characterSheet: CharacterSheetView;
  let tristramHub: TristramHub;

  const toggleInventory = () => {
    inventoryView.toggle();
    if (inventoryView.isVisible) characterSheet.close();
  };

  const toggleCharacter = () => {
    characterSheet.toggle();
    if (characterSheet.isVisible) inventoryView.close();
  };

  const toggleAutomap = () => {
    const isVisible = automap.toggle();
    sounds.play(isVisible ? 'portal_open' : 'item_equip');
  };

  const hud = new GothicHUD(
    app.screen.width,
    app.screen.height,
    toggleInventory,
    toggleCharacter,
    toggleAutomap
  );
  layers.hudLayer.addChild(hud.container);

  inventoryView = new InventoryView(player, (k) => sounds.play(k));
  inventoryView.container.x = app.screen.width / 2 - 170;
  inventoryView.container.y = app.screen.height / 2 - 230;
  inventoryView.onDropItem = (item) => {
    groundItems.dropItem(item, Math.floor(player.gx), Math.floor(player.gy), 3000);
    sounds.play(item.type === ItemType.GOLD ? 'gold_pickup' : 'item_equip');
    floatingTexts.spawn(
      `Dropped ${item.name}`,
      player.spriteContainer.x,
      player.spriteContainer.y - 30,
      item.quality === 'unique' ? 0xd4af37 : (item.quality === 'magic' ? 0x59a2ff : 0xcccccc)
    );
  };
  layers.modalLayer.addChild(inventoryView.container);

  characterSheet = new CharacterSheetView(player, (k) => sounds.play(k));
  characterSheet.container.x = app.screen.width / 2 - 150;
  characterSheet.container.y = app.screen.height / 2 - 210;
  layers.modalLayer.addChild(characterSheet.container);

  tristramHub = new TristramHub(
    player,
    () => {
      // Returning to dungeon
      sounds.play('portal_open');
    },
    (k) => sounds.play(k)
  );
  tristramHub.container.x = app.screen.width / 2 - 240;
  tristramHub.container.y = app.screen.height / 2 - 200;
  layers.modalLayer.addChild(tristramHub.container);

  // 7. Input & Hotkeys
  input.onKeyDown((code) => {
    if (code === 'KeyI') toggleInventory();
    if (code === 'KeyC') toggleCharacter();
    if (code === 'Tab') toggleAutomap();
    if (code === 'KeyJ') performPlayerAttack();
    if (code === 'Escape') {
      inventoryView.close();
      characterSheet.close();
      tristramHub.close();
    }
    // Belt hotkeys 1, 2, 3, 4
    if (code === 'Digit1') handleBeltUse(0);
    if (code === 'Digit2') handleBeltUse(1);
    if (code === 'Digit3') handleBeltUse(2);
    if (code === 'Digit4') handleBeltUse(3);
  });

  function performPlayerAttack() {
    if (player.state === ActionState.DEAD || player.state === ActionState.HIT_RECOVERY) {
      return;
    }
    if (inventoryView.isVisible || characterSheet.isVisible || tristramHub.isVisible) {
      return;
    }

    const worldPos = camera.screenToWorld(input.state.mouseScreen.x, input.state.mouseScreen.y);
    const gridPos = screenToGrid(worldPos.x, worldPos.y);

    let targetMonster: Monster | null = null;
    let closestDist = 1.45;

    // 1. Check if mouse is hovering over an alive monster in attack range
    for (const m of monsters) {
      if (m.state !== ActionState.DEAD) {
        const mouseDist = Math.hypot(m.gx - gridPos.gx, m.gy - gridPos.gy);
        const playerDist = Math.hypot(m.gx - player.gx, m.gy - player.gy);
        if (mouseDist <= 1.2 && playerDist <= 1.45) {
          targetMonster = m;
          break;
        }
      }
    }

    // 2. If not hovering directly on a monster, find the closest monster within melee range
    if (!targetMonster) {
      for (const m of monsters) {
        if (m.state !== ActionState.DEAD) {
          const dist = Math.hypot(m.gx - player.gx, m.gy - player.gy);
          if (dist <= closestDist) {
            closestDist = dist;
            targetMonster = m;
          }
        }
      }
    }

    // 3. Face target or aim direction and trigger attack
    if (targetMonster) {
      player.setDirectionFromDelta(targetMonster.gx - player.gx, targetMonster.gy - player.gy);
      player.triggerAttack(targetMonster);
    } else {
      const dx = gridPos.gx - player.gx;
      const dy = gridPos.gy - player.gy;
      if (Math.hypot(dx, dy) > 0.05) {
        player.setDirectionFromDelta(dx, dy);
      }
      player.triggerAttack(null);
    }
  }

  function handleBeltUse(slotIdx: number) {
    const item = player.belt.getSlot(slotIdx);
    if (!item) return;

    if (item.type === ItemType.SCROLL && item.name.includes('Portal')) {
      player.belt.useSlot(slotIdx);
      sounds.play('portal_open');
      tristramHub.open();
    } else {
      player.useBeltSlot(slotIdx);
    }
  }

  function handleDungeonDescent() {
    inventoryView.close();
    characterSheet.close();
    currentLevelNumber++;
    sounds.play('footstep');
    floatingTexts.spawn(
      currentLevelNumber === 2 ? 'CATHEDRAL LEVEL 2 - THE LAIR OF THE BUTCHER' : `CATHEDRAL LEVEL ${currentLevelNumber}`,
      app.screen.width / 2,
      app.screen.height / 2 - 60,
      0xd4af37
    );

    // Generate new floor
    dungeon = DungeonGenerator.generate(currentLevelNumber);
    fog = new FogOfWar(dungeon.width, dungeon.height);
    layers.lightingLayer.removeChildren();
    layers.lightingLayer.addChild(fog.graphics);

    tilemapRenderer.renderDungeon(dungeon);

    player.gx = dungeon.playerSpawn.gx;
    player.gy = dungeon.playerSpawn.gy;
    player.currentPath = [];
    player.updateScreenPosition();
    camera.jumpTo(player.spriteContainer.x, player.spriteContainer.y);

    spawnMonstersForDungeon();
  }

  // Mouse interaction handler
  let lastClickTime = 0;
  window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only primary click

    // Ignore clicks on bottom HUD bar
    if (e.clientY >= app.screen.height - 90) {
      return;
    }

    if (tristramHub.isVisible) {
      const hubX = tristramHub.container.x;
      const hubY = tristramHub.container.y;
      if (e.clientX >= hubX && e.clientX <= hubX + 480 && e.clientY >= hubY && e.clientY <= hubY + 400) {
        return;
      }
    }

    if (characterSheet.isVisible) {
      const charX = characterSheet.container.x;
      const charY = characterSheet.container.y;
      if (e.clientX >= charX && e.clientX <= charX + 300 && e.clientY >= charY && e.clientY <= charY + 420) {
        return;
      }
    }

    if (inventoryView.isVisible) {
      const invX = inventoryView.container.x;
      const invY = inventoryView.container.y;
      const insideInventory = (
        e.clientX >= invX &&
        e.clientX <= invX + 340 &&
        e.clientY >= invY &&
        e.clientY <= invY + 460
      );

      if (insideInventory) {
        return; // Pixi inventory event listeners handle clicks inside
      }

      // Click is OUTSIDE the inventory window!
      // If holding an item, drop it on the ground at feet / clicked location!
      if (inventoryView.heldItem) {
        const itemToDrop = inventoryView.heldItem;
        inventoryView.heldItem = null;
        inventoryView.refresh();

        const worldPos = camera.screenToWorld(e.clientX, e.clientY);
        const gridPos = screenToGrid(worldPos.x, worldPos.y);

        const dist = Math.hypot(gridPos.gx - player.gx, gridPos.gy - player.gy);
        let dropGx = Math.floor(player.gx);
        let dropGy = Math.floor(player.gy);

        if (
          dist <= 3.5 &&
          gridPos.gx >= 0 && gridPos.gx < dungeon.width &&
          gridPos.gy >= 0 && gridPos.gy < dungeon.height &&
          dungeon.tiles[gridPos.gy][gridPos.gx] === TileType.FLOOR
        ) {
          dropGx = gridPos.gx;
          dropGy = gridPos.gy;
        }

        groundItems.dropItem(itemToDrop, dropGx, dropGy, 3000);
        sounds.play(itemToDrop.type === ItemType.GOLD ? 'gold_pickup' : 'item_equip');
        floatingTexts.spawn(
          `Dropped ${itemToDrop.name}`,
          player.spriteContainer.x,
          player.spriteContainer.y - 30,
          itemToDrop.quality === 'unique' ? 0xd4af37 : (itemToDrop.quality === 'magic' ? 0x59a2ff : 0xcccccc)
        );
        return;
      }
    }

    const now = Date.now();
    if (now - lastClickTime < 120) return; // Debounce rapid click spam
    lastClickTime = now;

    const worldPos = camera.screenToWorld(e.clientX, e.clientY);
    const gridPos = screenToGrid(worldPos.x, worldPos.y);

    // 0. Check if clicking on or near a ground item to pick it up manually
    const groundItemNearClick = groundItems.getItemsNear(gridPos.gx, gridPos.gy, 0.9, true)[0];
    if (groundItemNearClick) {
      const distToPlayer = Math.hypot(groundItemNearClick.gx - player.gx, groundItemNearClick.gy - player.gy);
      if (distToPlayer <= 1.4) {
        if (player.inventory.autoPlace(groundItemNearClick.item)) {
          groundItems.removeItem(groundItemNearClick);
          sounds.play(groundItemNearClick.item.type === ItemType.GOLD ? 'gold_pickup' : 'item_equip');
          floatingTexts.spawn(
            `+${groundItemNearClick.item.name}`,
            player.spriteContainer.x,
            player.spriteContainer.y - 25,
            groundItemNearClick.item.quality === 'unique' ? 0xd4af37 : 0xffffff
          );
          inventoryView.refresh();
          return;
        }
      } else {
        // Pathfind directly to ground item and clear pickup cooldown so arriving picks it up
        groundItemNearClick.canPickupAfter = 0;
        player.targetEntity = null;
        player.currentPath = Pathfinding.findPath(
          dungeon,
          Math.floor(player.gx),
          Math.floor(player.gy),
          Math.floor(groundItemNearClick.gx),
          Math.floor(groundItemNearClick.gy)
        );
        return;
      }
    }

    // 1. Check if clicking directly on a monster
    for (const m of monsters) {
      if (m.state !== ActionState.DEAD) {
        const mDist = Math.hypot(m.gx - gridPos.gx, m.gy - gridPos.gy);
        if (mDist <= 1.2) {
          const playerDist = Math.hypot(m.gx - player.gx, m.gy - player.gy);
          if (playerDist <= 1.45) {
            player.setDirectionFromDelta(m.gx - player.gx, m.gy - player.gy);
            player.triggerAttack(m);
          } else {
            // Path towards monster
            player.targetEntity = m;
            player.currentPath = Pathfinding.findPath(
              dungeon,
              Math.floor(player.gx),
              Math.floor(player.gy),
              Math.floor(m.gx),
              Math.floor(m.gy)
            );
          }
          return;
        }
      }
    }

    // 2. Check if Shift is held down: Attack in place!
    if (input.state.isShiftDown) {
      const dx = gridPos.gx - player.gx;
      const dy = gridPos.gy - player.gy;
      player.setDirectionFromDelta(dx, dy);
      player.triggerAttack(null);
      return;
    }

    // 3. Check interactive props (doors, sarcophagi, urns, stairs)
    if (gridPos.gx >= 0 && gridPos.gx < dungeon.width && gridPos.gy >= 0 && gridPos.gy < dungeon.height) {
      const tile = dungeon.tiles[gridPos.gy][gridPos.gx];

      // Door
      if (tile === TileType.DOOR) {
        const doorKey = `${gridPos.gx},${gridPos.gy}`;
        let door = dungeon.doors.get(doorKey);
        if (!door) {
          door = { gx: gridPos.gx, gy: gridPos.gy, isOpen: false };
          dungeon.doors.set(doorKey, door);
        }
        door.isOpen = !door.isOpen;
        // Update collision & rendering
        dungeon.tiles[gridPos.gy][gridPos.gx] = door.isOpen ? TileType.FLOOR : TileType.DOOR;
        tilemapRenderer.updateDoor(door);
        sounds.play('footstep');
        return;
      }

      // Stairs Down
      if (tile === TileType.STAIRS_DOWN) {
        const dist = Math.hypot(gridPos.gx - player.gx, gridPos.gy - player.gy);
        if (dist <= 1.8) {
          handleDungeonDescent();
          return;
        }
      }

      // Sarcophagus / Urn
      const propKey = `${gridPos.gx},${gridPos.gy}`;
      const prop = dungeon.props.get(propKey);
      if (prop && !prop.isOpenedOrBroken) {
        const dist = Math.hypot(gridPos.gx - player.gx, gridPos.gy - player.gy);
        if (dist <= 1.8) {
          prop.isOpenedOrBroken = true;
          tilemapRenderer.updatePropBroken(prop);
          sounds.play(prop.type === TileType.URN ? 'bone_clatter' : 'item_equip');

          // Drop loot
          const drops = [
            Math.random() < 0.5 ? AffixGenerator.createHealthPotion() : AffixGenerator.createGoldPile(75)
          ];
          for (const d of drops) {
            groundItems.dropItem(d, gridPos.gx, gridPos.gy);
          }
          return;
        }
      }
    }

    // 4. Default: Pathfind & Walk
    player.targetEntity = null;
    player.currentPath = Pathfinding.findPath(
      dungeon,
      Math.floor(player.gx),
      Math.floor(player.gy),
      gridPos.gx,
      gridPos.gy
    );
  });

  // Handle window resizing
  window.addEventListener('resize', () => {
    camera.setViewport(app.screen.width, app.screen.height);
    inventoryView.container.x = app.screen.width / 2 - 170;
    inventoryView.container.y = app.screen.height / 2 - 230;
    characterSheet.container.x = app.screen.width / 2 - 150;
    characterSheet.container.y = app.screen.height / 2 - 210;
    tristramHub.container.x = app.screen.width / 2 - 240;
    tristramHub.container.y = app.screen.height / 2 - 200;
  });

  // 8. Main Game Loop (Ticker)
  app.ticker.add((ticker) => {
    const deltaMs = ticker.deltaMS;

    // Continuous attack while holding J key
    if (input.isKeyDown('KeyJ')) {
      performPlayerAttack();
    }

    // Handle WASD keyboard movement
    if (player.state !== ActionState.ATTACK && input.state.hasWasdMovement && !input.state.isShiftDown && !input.isKeyDown('KeyJ')) {
      player.moveByWasd(input.state.moveAxisX, input.state.moveAxisY, deltaMs, dungeon);
    } else {
      player.update(deltaMs);
    }

    // Camera follow player
    camera.setTarget(player.spriteContainer.x, player.spriteContainer.y);
    camera.update(deltaMs);
    const cameraOffset = camera.getScreenOffset();
    layers.updateCameraOffset(cameraOffset.x, cameraOffset.y);

    // Fog of War update
    fog.update(dungeon, player.gx, player.gy, player.stats.lightRadiusBonus);
    tilemapRenderer.updateVisibility(dungeon, fog);

    // Monsters update
    for (const m of monsters) {
      m.updateAI(player, dungeon, deltaMs);
      // Monster sprite visibility governed by player light radius
      m.spriteContainer.visible = fog.isVisible(m.gx, m.gy);
    }

    // Ground items update & auto-pickup check
    groundItems.updateVisibility((gx, gy) => fog.isExplored(gx, gy));
    const itemsNear = groundItems.getItemsNear(player.gx, player.gy, 0.9);
    for (const groundItem of itemsNear) {
      if (player.inventory.autoPlace(groundItem.item)) {
        groundItems.removeItem(groundItem);
        sounds.play(groundItem.item.type === ItemType.GOLD ? 'gold_pickup' : 'item_equip');
        floatingTexts.spawn(
          `+${groundItem.item.name}`,
          player.spriteContainer.x,
          player.spriteContainer.y - 25,
          groundItem.item.quality === 'unique' ? 0xd4af37 : 0xffffff
        );
        inventoryView.refresh();
      }
    }

    // Floating text update
    floatingTexts.update(deltaMs);

    // Automap update
    automap.update(dungeon, fog, player.gx, player.gy, cameraOffset.x, cameraOffset.y);

    // HUD & Inventory cursor updates
    hud.update(player, app.screen.width, app.screen.height);
    inventoryView.updateCursor(input.state.mouseScreen.x, input.state.mouseScreen.y);
  });
}

bootstrap().catch(console.error);
