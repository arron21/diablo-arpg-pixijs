import { Texture } from 'pixi.js';
import { TILE_WIDTH, TILE_HEIGHT } from '../engine/IsoMath';

export type Direction8 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
// 0: East, 1: South-East, 2: South, 3: South-West, 4: West, 5: North-West, 6: North, 7: North-East

export class AssetFactory {
  private static textures: Map<string, Texture> = new Map();

  public static getTexture(key: string): Texture {
    const tex = this.textures.get(key);
    if (!tex) {
      throw new Error(`Texture '${key}' not found in AssetFactory.`);
    }
    return tex;
  }

  public static hasTexture(key: string): boolean {
    return this.textures.has(key);
  }

  public static init(): void {
    if (this.textures.size > 0) return;

    this.createFloorTiles();
    this.createWallTiles();
    this.createInteractiveProps();
    this.createWarriorSprites();
    this.createMonsterSprites();
    this.createItemIcons();
    this.createUIElements();
  }

  private static storeTexture(key: string, canvas: HTMLCanvasElement): Texture {
    const texture = Texture.from(canvas);
    this.textures.set(key, texture);
    return texture;
  }

  // ==========================================
  // FLOOR TILES (64x32 Isometric Rhombus)
  // ==========================================
  private static createFloorTiles(): void {
    const W = TILE_WIDTH;
    const H = TILE_HEIGHT;

    // 1. Plain Cathedral Stone
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Draw isometric rhombus
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W, H / 2);
      ctx.lineTo(W / 2, H);
      ctx.lineTo(0, H / 2);
      ctx.closePath();

      ctx.fillStyle = '#222026';
      ctx.fill();

      // Stone flagstone seams
      ctx.strokeStyle = '#141217';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Stone texture grain
      ctx.fillStyle = '#2a2730';
      ctx.fillRect(W / 2 - 8, H / 2 - 4, 16, 8);
      ctx.fillStyle = '#1c1a20';
      ctx.fillRect(W / 2 + 4, H / 2 - 6, 8, 4);

      // Inner tile division lines
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2 - 6);
      ctx.lineTo(W / 2 + 12, H / 2);
      ctx.moveTo(W / 2 - 12, H / 2);
      ctx.lineTo(W / 2, H / 2 + 6);
      ctx.strokeStyle = '#18161c';
      ctx.stroke();

      this.storeTexture('tile_floor_stone', canvas);
    }

    // 2. Cracked Ancient Stone
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W, H / 2);
      ctx.lineTo(W / 2, H);
      ctx.lineTo(0, H / 2);
      ctx.closePath();

      ctx.fillStyle = '#1e1c22';
      ctx.fill();
      ctx.strokeStyle = '#121015';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Jagged crack
      ctx.beginPath();
      ctx.moveTo(W / 2 - 10, H / 2 - 5);
      ctx.lineTo(W / 2 - 2, H / 2);
      ctx.lineTo(W / 2 + 8, H / 2 - 2);
      ctx.lineTo(W / 2 + 14, H / 2 + 4);
      ctx.strokeStyle = '#0d0c0f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      this.storeTexture('tile_floor_cracked', canvas);
    }

    // 3. Cathedral Red Carpet Runner
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Base stone
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W, H / 2);
      ctx.lineTo(W / 2, H);
      ctx.lineTo(0, H / 2);
      ctx.closePath();
      ctx.fillStyle = '#222026';
      ctx.fill();

      // Crimson velvet runner center
      ctx.beginPath();
      ctx.moveTo(W / 2, 4);
      ctx.lineTo(W - 8, H / 2);
      ctx.lineTo(W / 2, H - 4);
      ctx.lineTo(8, H / 2);
      ctx.closePath();
      ctx.fillStyle = '#4a0e14';
      ctx.fill();

      // Gold fringe trim
      ctx.strokeStyle = '#8a6519';
      ctx.lineWidth = 1;
      ctx.stroke();

      this.storeTexture('tile_floor_carpet', canvas);
    }

    // 4. Blood Decal Floor
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W, H / 2);
      ctx.lineTo(W / 2, H);
      ctx.lineTo(0, H / 2);
      ctx.closePath();
      ctx.fillStyle = '#201e24';
      ctx.fill();
      ctx.strokeStyle = '#141217';
      ctx.stroke();

      // Blood pool
      ctx.beginPath();
      ctx.ellipse(W / 2 + 2, H / 2 + 1, 10, 5, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#5c0606';
      ctx.fill();

      // Splatters
      ctx.fillStyle = '#3d0404';
      ctx.fillRect(W / 2 - 8, H / 2 + 3, 3, 2);
      ctx.fillRect(W / 2 + 12, H / 2 - 2, 2, 2);

      this.storeTexture('tile_floor_blood', canvas);
    }
  }

  // ==========================================
  // WALLS & ARCHWAYS (Isometric 3D Blocks)
  // ==========================================
  private static createWallTiles(): void {
    const W = 64;
    const H = 72; // Taller to cover vertical wall height

    // 1. West-facing Wall (left edge)
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Top cap (slanted rhombus)
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(48, 8);
      ctx.lineTo(16, 24);
      ctx.lineTo(0, 16);
      ctx.closePath();
      ctx.fillStyle = '#3a3642';
      ctx.fill();
      ctx.strokeStyle = '#1e1c24';
      ctx.stroke();

      // West face (lit side)
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(16, 24);
      ctx.lineTo(16, H - 8);
      ctx.lineTo(0, H - 16);
      ctx.closePath();
      ctx.fillStyle = '#2c2933';
      ctx.fill();
      ctx.strokeStyle = '#1a1820';
      ctx.stroke();

      // Brick rows
      ctx.strokeStyle = '#18161c';
      for (let y = 30; y < H - 10; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y - 8);
        ctx.lineTo(16, y);
        ctx.stroke();
      }

      this.storeTexture('tile_wall_west', canvas);
    }

    // 2. North-facing Wall (right edge)
    {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Top cap
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(64, 16);
      ctx.lineTo(48, 24);
      ctx.lineTo(16, 8);
      ctx.closePath();
      ctx.fillStyle = '#3a3642';
      ctx.fill();
      ctx.strokeStyle = '#1e1c24';
      ctx.stroke();

      // North face (shadowed side)
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(48, 24);
      ctx.lineTo(48, H - 8);
      ctx.lineTo(16, H - 24);
      ctx.closePath();
      ctx.fillStyle = '#201e26';
      ctx.fill();
      ctx.strokeStyle = '#121117';
      ctx.stroke();

      // Brick rows
      ctx.strokeStyle = '#141217';
      for (let y = 20; y < H - 15; y += 10) {
        ctx.beginPath();
        ctx.moveTo(16, y);
        ctx.lineTo(48, y + 16);
        ctx.stroke();
      }

      this.storeTexture('tile_wall_north', canvas);
    }

    // 3. Gothic Stone Column / Pillar
    {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 72;
      const ctx = canvas.getContext('2d')!;

      // Pillar base
      ctx.fillStyle = '#222026';
      ctx.fillRect(14, 52, 20, 16);

      // Pillar shaft
      ctx.fillStyle = '#302d38';
      ctx.fillRect(16, 12, 16, 42);

      // Shaft highlight & shadow
      ctx.fillStyle = '#423e4d';
      ctx.fillRect(18, 12, 4, 42);
      ctx.fillStyle = '#1c1a21';
      ctx.fillRect(28, 12, 4, 42);

      // Capital / Top carving
      ctx.fillStyle = '#3a3644';
      ctx.fillRect(12, 4, 24, 10);
      ctx.strokeStyle = '#141217';
      ctx.strokeRect(12, 4, 24, 10);

      this.storeTexture('tile_pillar', canvas);
    }
  }

  // ==========================================
  // INTERACTIVE PROPS & DOORS
  // ==========================================
  private static createInteractiveProps(): void {
    // 1. Closed Wooden Door
    {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // Stone arch frame
      ctx.fillStyle = '#222028';
      ctx.fillRect(6, 4, 36, 56);

      // Heavy wood planks
      ctx.fillStyle = '#422817';
      ctx.fillRect(10, 8, 28, 50);

      // Iron studs and hinges
      ctx.fillStyle = '#1e1c20';
      ctx.fillRect(10, 14, 28, 4);
      ctx.fillRect(10, 42, 28, 4);

      // Iron door ring / handle
      ctx.beginPath();
      ctx.arc(32, 32, 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#736d5c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      this.storeTexture('prop_door_closed', canvas);
    }

    // 2. Open Door
    {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // Stone arch frame with dark doorway inside
      ctx.fillStyle = '#121015';
      ctx.fillRect(6, 4, 36, 56);

      // Door swung open to the side
      ctx.fillStyle = '#301d10';
      ctx.beginPath();
      ctx.moveTo(38, 8);
      ctx.lineTo(44, 12);
      ctx.lineTo(44, 58);
      ctx.lineTo(38, 54);
      ctx.closePath();
      ctx.fill();

      this.storeTexture('prop_door_open', canvas);
    }

    // 3. Wall Torch Sconce
    {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 36;
      const ctx = canvas.getContext('2d')!;

      // Metal wall bracket
      ctx.fillStyle = '#2b2930';
      ctx.fillRect(8, 14, 8, 16);
      ctx.fillStyle = '#18161c';
      ctx.fillRect(10, 18, 4, 12);

      // Flame core
      ctx.beginPath();
      ctx.moveTo(12, 4);
      ctx.quadraticCurveTo(18, 10, 14, 16);
      ctx.quadraticCurveTo(6, 10, 12, 4);
      ctx.fillStyle = '#ff8800';
      ctx.fill();

      // Yellow inner flame
      ctx.beginPath();
      ctx.moveTo(12, 8);
      ctx.quadraticCurveTo(15, 12, 13, 15);
      ctx.quadraticCurveTo(9, 12, 12, 8);
      ctx.fillStyle = '#ffe666';
      ctx.fill();

      this.storeTexture('prop_torch', canvas);
    }

    // 4. Stone Sarcophagus
    {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 40;
      const ctx = canvas.getContext('2d')!;

      // Isometric tomb slab
      ctx.beginPath();
      ctx.moveTo(24, 4);
      ctx.lineTo(44, 14);
      ctx.lineTo(24, 24);
      ctx.lineTo(4, 14);
      ctx.closePath();
      ctx.fillStyle = '#383442';
      ctx.fill();
      ctx.strokeStyle = '#18161e';
      ctx.stroke();

      // Tomb front face
      ctx.beginPath();
      ctx.moveTo(4, 14);
      ctx.lineTo(24, 24);
      ctx.lineTo(24, 36);
      ctx.lineTo(4, 26);
      ctx.closePath();
      ctx.fillStyle = '#26232e';
      ctx.fill();

      // Tomb right face
      ctx.beginPath();
      ctx.moveTo(24, 24);
      ctx.lineTo(44, 14);
      ctx.lineTo(44, 26);
      ctx.lineTo(24, 36);
      ctx.closePath();
      ctx.fillStyle = '#1e1c24';
      ctx.fill();

      // Ornate cross carving on lid
      ctx.fillStyle = '#18161e';
      ctx.fillRect(22, 9, 4, 10);
      ctx.fillRect(17, 12, 14, 3);

      this.storeTexture('prop_sarcophagus', canvas);
    }

    // 5. Breakable Clay Urn / Barrel
    {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;

      // Clay urn body
      ctx.beginPath();
      ctx.ellipse(12, 18, 9, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#784628';
      ctx.fill();
      ctx.strokeStyle = '#3d2010';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Urn neck and rim
      ctx.fillStyle = '#8f5634';
      ctx.fillRect(8, 6, 8, 4);
      ctx.strokeStyle = '#3d2010';
      ctx.strokeRect(7, 4, 10, 3);

      this.storeTexture('prop_urn', canvas);
    }

    // 6. Descent Stairs (Stairs Down)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 48;
      const ctx = canvas.getContext('2d')!;

      // Dark hole in floor
      ctx.beginPath();
      ctx.moveTo(32, 4);
      ctx.lineTo(60, 18);
      ctx.lineTo(32, 32);
      ctx.lineTo(4, 18);
      ctx.closePath();
      ctx.fillStyle = '#050406';
      ctx.fill();

      // Descending stone steps
      const steps = [
        { y: 8, w: 28, color: '#383442' },
        { y: 14, w: 22, color: '#2b2833' },
        { y: 20, w: 16, color: '#1f1d24' },
        { y: 26, w: 10, color: '#131117' }
      ];

      for (const step of steps) {
        ctx.fillStyle = step.color;
        ctx.fillRect(32 - step.w / 2, step.y, step.w, 4);
      }

      // Stone border
      ctx.strokeStyle = '#484254';
      ctx.lineWidth = 2;
      ctx.stroke();

      this.storeTexture('prop_stairs_down', canvas);
    }

    // 7. Town Portal Swirl
    {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // Blue mystic portal oval
      const grad = ctx.createRadialGradient(24, 32, 2, 24, 32, 22);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#38a2ff');
      grad.addColorStop(0.7, '#10398f');
      grad.addColorStop(1, 'rgba(5, 10, 30, 0)');

      ctx.beginPath();
      ctx.ellipse(24, 32, 18, 28, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Arcane runes / sparks
      ctx.fillStyle = '#c7e6ff';
      ctx.fillRect(16, 20, 2, 2);
      ctx.fillRect(30, 24, 2, 2);
      ctx.fillRect(20, 44, 2, 2);
      ctx.fillRect(28, 40, 2, 2);

      this.storeTexture('prop_portal', canvas);
    }
  }

  // ==========================================
  // WARRIOR SPRITES (8 Directions x Actions)
  // ==========================================
  private static createWarriorSprites(): void {
    // Generate sprites for 8 directions and states:
    // states: idle, walk_0, walk_1, attack_0, attack_1, block, hit, dead
    const directions = [0, 1, 2, 3, 4, 5, 6, 7];
    const states = ['idle', 'walk_0', 'walk_1', 'attack_0', 'attack_1', 'block', 'hit', 'dead'];

    for (const dir of directions) {
      for (const state of states) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 56;
        const ctx = canvas.getContext('2d')!;

        this.drawWarriorFrame(ctx, dir, state);
        this.storeTexture(`warrior_${state}_dir${dir}`, canvas);
      }
    }
  }

  private static drawWarriorFrame(ctx: CanvasRenderingContext2D, dir: number, state: string): void {
    const cx = 24;
    const cy = 28;

    if (state === 'dead') {
      // Fallen warrior on the ground
      ctx.fillStyle = '#4a4454';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 14, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Sword on floor
      ctx.strokeStyle = '#a6afb8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 10);
      ctx.lineTo(cx - 2, cy + 14);
      ctx.stroke();

      // Blood pool
      ctx.fillStyle = '#6e0707';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy + 14, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Directional offsets for facing:
    // angle in radians for direction
    const angle = (dir * 45) * (Math.PI / 180);
    const facingX = Math.cos(angle);
    const facingY = Math.sin(angle);

    // Hit flinch offset
    let flinchX = 0;
    let flinchY = 0;
    if (state === 'hit') {
      flinchX = -facingX * 3;
      flinchY = -facingY * 3;
    }

    // Walking leg cycle
    let legOffset = 0;
    if (state === 'walk_0') legOffset = 2;
    if (state === 'walk_1') legOffset = -2;

    const px = cx + flinchX;
    const py = cy + flinchY;

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + 18, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Boots
    ctx.fillStyle = '#2e2c33';
    ctx.fillRect(px - 5, py + 8 + legOffset, 4, 8);
    ctx.fillRect(px + 1, py + 8 - legOffset, 4, 8);

    // Silver plate armor torso
    ctx.fillStyle = '#7a7f8a';
    ctx.fillRect(px - 7, py - 4, 14, 13);
    // Torso highlight
    ctx.fillStyle = '#a1a8b5';
    ctx.fillRect(px - 5, py - 3, 4, 11);
    // Belt with gold buckle
    ctx.fillStyle = '#3b2516';
    ctx.fillRect(px - 7, py + 6, 14, 3);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(px - 1, py + 6, 3, 3);

    // Helm / Head with eye slit
    ctx.fillStyle = '#8c93a0';
    ctx.beginPath();
    ctx.arc(px, py - 11, 6, 0, Math.PI * 2);
    ctx.fill();
    // Visor slit
    ctx.fillStyle = '#141217';
    ctx.fillRect(px - 3 + facingX * 2, py - 12 + facingY * 2, 6, 2);

    // Arms, Weapon & Shield according to state & direction
    const isAttacking = state.startsWith('attack');
    const isBlocking = state === 'block';

    // Off-hand Shield (Heater shield with red cross)
    const shieldX = px - 8 - facingX * 2;
    const shieldY = py + (isBlocking ? -4 : 0);
    ctx.fillStyle = '#8a1d1d';
    ctx.beginPath();
    ctx.moveTo(shieldX, shieldY - 4);
    ctx.lineTo(shieldX + 8, shieldY - 4);
    ctx.lineTo(shieldX + 7, shieldY + 6);
    ctx.lineTo(shieldX + 4, shieldY + 10);
    ctx.lineTo(shieldX + 1, shieldY + 6);
    ctx.closePath();
    ctx.fill();
    // Shield rim
    ctx.strokeStyle = '#c4ab58';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Main-hand Weapon (Gleaming Steel Broadsword)
    const swordHandX = px + 6 + facingX * 4;
    const swordHandY = py + 2;

    if (isAttacking) {
      const swingFrame = state === 'attack_0' ? 0 : 1;
      const swingAngle = angle + (swingFrame === 0 ? -0.8 : 0.8);
      const tipX = swordHandX + Math.cos(swingAngle) * 16;
      const tipY = swordHandY + Math.sin(swingAngle) * 16;

      ctx.strokeStyle = '#e6edf5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(swordHandX, swordHandY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Blade slash trail
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(swordHandX, swordHandY, 14, swingAngle - 0.4, swingAngle + 0.4);
      ctx.stroke();
    } else {
      // Idle / Walking blade resting or held upright
      ctx.strokeStyle = '#b8c3cf';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(swordHandX, swordHandY);
      ctx.lineTo(swordHandX + facingX * 6, swordHandY - 12);
      ctx.stroke();
      // Gold pommel
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(swordHandX - 1, swordHandY, 3, 3);
    }
  }

  // ==========================================
  // MONSTER SPRITES
  // ==========================================
  private static createMonsterSprites(): void {
    const directions = [0, 1, 2, 3, 4, 5, 6, 7];
    const monsterTypes = ['skeleton', 'archer', 'fallen', 'butcher'];
    const states = ['idle', 'walk_0', 'walk_1', 'attack', 'hit', 'dead'];

    for (const type of monsterTypes) {
      for (const dir of directions) {
        for (const state of states) {
          const canvas = document.createElement('canvas');
          canvas.width = type === 'butcher' ? 64 : 48;
          canvas.height = type === 'butcher' ? 64 : 48;
          const ctx = canvas.getContext('2d')!;

          this.drawMonsterFrame(ctx, type, dir, state);
          this.storeTexture(`${type}_${state}_dir${dir}`, canvas);
        }
      }
    }
  }

  private static drawMonsterFrame(ctx: CanvasRenderingContext2D, type: string, dir: number, state: string): void {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const angle = (dir * 45) * (Math.PI / 180);
    const fx = Math.cos(angle);
    const fy = Math.sin(angle);

    if (state === 'dead') {
      if (type === 'skeleton' || type === 'archer') {
        // Pile of bone fragments
        ctx.fillStyle = '#e8e6db';
        ctx.fillRect(cx - 8, cy + 6, 6, 2);
        ctx.fillRect(cx + 2, cy + 8, 8, 2);
        ctx.fillRect(cx - 4, cy + 10, 7, 3);
        // Skull
        ctx.beginPath();
        ctx.arc(cx - 2, cy + 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#141217';
        ctx.fillRect(cx - 4, cy + 5, 2, 2);
      } else {
        // Blood pool & carcass
        ctx.fillStyle = '#5c0606';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = type === 'butcher' ? '#782020' : '#4a1515';
        ctx.fillRect(cx - 8, cy + 6, 16, 8);
      }
      return;
    }

    const hitOffset = state === 'hit' ? -3 : 0;
    const walkOffset = state === 'walk_0' ? 2 : (state === 'walk_1' ? -2 : 0);

    const px = cx + fx * hitOffset;
    const py = cy + fy * hitOffset;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + (type === 'butcher' ? 18 : 14), type === 'butcher' ? 16 : 10, type === 'butcher' ? 8 : 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'skeleton' || type === 'archer') {
      // SKELETON
      ctx.fillStyle = '#e6e4d8';
      // Legs
      ctx.fillRect(px - 4, py + 4 + walkOffset, 2, 8);
      ctx.fillRect(px + 2, py + 4 - walkOffset, 2, 8);
      // Ribcage
      ctx.fillRect(px - 5, py - 5, 10, 9);
      ctx.fillStyle = '#1c1a20';
      ctx.fillRect(px - 4, py - 3, 8, 2);
      ctx.fillRect(px - 4, py + 1, 8, 2);

      // Skull
      ctx.fillStyle = '#f0eee4';
      ctx.beginPath();
      ctx.arc(px, py - 11, 5, 0, Math.PI * 2);
      ctx.fill();
      // Glowing eye sockets (red)
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(px - 3 + fx * 2, py - 12 + fy * 2, 2, 2);
      ctx.fillRect(px + 1 + fx * 2, py - 12 + fy * 2, 2, 2);

      if (type === 'skeleton') {
        // Rusty Scimitar
        ctx.strokeStyle = '#8a5c3b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 6, py);
        ctx.lineTo(px + 6 + fx * 8, py - 8 + fy * 6);
        ctx.stroke();
      } else {
        // Bone Bow
        ctx.strokeStyle = '#c4bfaf';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px + 6 + fx * 4, py, 8, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }
    } else if (type === 'fallen') {
      // FALLEN ONE (Red Imp)
      ctx.fillStyle = '#8f1c1c';
      // Skittering legs
      ctx.fillRect(px - 4, py + 4 + walkOffset, 3, 6);
      ctx.fillRect(px + 1, py + 4 - walkOffset, 3, 6);
      // Small hunched body
      ctx.fillRect(px - 5, py - 4, 10, 8);
      // Horned head
      ctx.beginPath();
      ctx.arc(px, py - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      // Horns
      ctx.fillStyle = '#3b0d0d';
      ctx.fillRect(px - 4, py - 13, 2, 4);
      ctx.fillRect(px + 2, py - 13, 2, 4);
      // Yellow glowing eyes
      ctx.fillStyle = '#ffee33';
      ctx.fillRect(px - 2 + fx * 2, py - 9 + fy * 2, 2, 2);

      // Curved dagger
      ctx.strokeStyle = '#808791';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 5, py);
      ctx.lineTo(px + 5 + fx * 6, py + fy * 6);
      ctx.stroke();
    } else if (type === 'butcher') {
      // THE BUTCHER (Massive Demon)
      ctx.fillStyle = '#8a3333'; // Bloated pink/red demon flesh
      // Stomping legs
      ctx.fillRect(px - 8, py + 8 + walkOffset, 6, 12);
      ctx.fillRect(px + 2, py + 8 - walkOffset, 6, 12);

      // Huge massive belly / torso
      ctx.beginPath();
      ctx.arc(px, py - 2, 14, 0, Math.PI * 2);
      ctx.fill();

      // Blood-stained butcher's apron
      ctx.fillStyle = '#c7bca5';
      ctx.fillRect(px - 8, py - 6, 16, 16);
      ctx.fillStyle = '#7a0909'; // Blood stains
      ctx.fillRect(px - 6, py - 2, 6, 8);
      ctx.fillRect(px + 1, py + 2, 5, 5);

      // Ugly brutal head
      ctx.fillStyle = '#9e3a3a';
      ctx.beginPath();
      ctx.arc(px, py - 16, 8, 0, Math.PI * 2);
      ctx.fill();
      // Snarl & yellow eyes
      ctx.fillStyle = '#ffff66';
      ctx.fillRect(px - 4 + fx * 3, py - 18 + fy * 2, 3, 2);
      ctx.fillRect(px + 1 + fx * 3, py - 18 + fy * 2, 3, 2);
      ctx.fillStyle = '#ffffff'; // Fangs
      ctx.fillRect(px - 3, py - 13, 6, 2);

      // Giant Butcher Cleaver
      const cleaverX = px + 12 + fx * 6;
      const cleaverY = py - 4 + fy * 4;
      ctx.fillStyle = '#b0b8c4'; // Heavy steel blade
      ctx.fillRect(cleaverX - 3, cleaverY - 14, 8, 18);
      ctx.fillStyle = '#730d0d'; // Blood along cutting edge
      ctx.fillRect(cleaverX + 3, cleaverY - 14, 2, 18);
      // Wood handle
      ctx.fillStyle = '#422517';
      ctx.fillRect(cleaverX - 1, cleaverY + 4, 4, 8);
    }
  }

  // ==========================================
  // ITEM ICONS (Grid Tetris)
  // ==========================================
  private static createItemIcons(): void {
    const CELL = 28; // standard inventory cell pixel size

    // 1. Health Potion (1x1)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL;
      canvas.height = CELL;
      const ctx = canvas.getContext('2d')!;

      // Glass flask
      ctx.beginPath();
      ctx.arc(14, 18, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#c70a1a';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Liquid reflection
      ctx.fillStyle = '#ff7580';
      ctx.fillRect(10, 14, 3, 4);

      // Cork stopper
      ctx.fillStyle = '#966336';
      ctx.fillRect(12, 6, 4, 4);

      this.storeTexture('icon_potion_health', canvas);
    }

    // 2. Mana Potion (1x1)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL;
      canvas.height = CELL;
      const ctx = canvas.getContext('2d')!;

      ctx.beginPath();
      ctx.arc(14, 18, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#0f52ba';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#6bb0ff';
      ctx.fillRect(10, 14, 3, 4);

      ctx.fillStyle = '#966336';
      ctx.fillRect(12, 6, 4, 4);

      this.storeTexture('icon_potion_mana', canvas);
    }

    // 3. Town Portal Scroll (1x1)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL;
      canvas.height = CELL;
      const ctx = canvas.getContext('2d')!;

      // Rolled parchment
      ctx.fillStyle = '#e8d8b7';
      ctx.fillRect(6, 6, 16, 16);
      ctx.strokeStyle = '#4a75ba';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, 16, 16);

      // Blue ribbon band
      ctx.fillStyle = '#1c66d9';
      ctx.fillRect(12, 6, 4, 16);

      this.storeTexture('icon_scroll_portal', canvas);
    }

    // 4. Gold Pile (1x1)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL;
      canvas.height = CELL;
      const ctx = canvas.getContext('2d')!;

      // Shiny gold coins
      const coins = [
        { x: 10, y: 18 }, { x: 14, y: 18 }, { x: 18, y: 18 },
        { x: 12, y: 14 }, { x: 16, y: 14 },
        { x: 14, y: 10 }
      ];

      for (const c of coins) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#d4af37';
        ctx.fill();
        ctx.strokeStyle = '#fff080';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      this.storeTexture('icon_gold', canvas);
    }

    // 5. Short Sword (1x2: 28 x 56)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL;
      canvas.height = CELL * 2;
      const ctx = canvas.getContext('2d')!;

      // Blade
      ctx.fillStyle = '#c5ccd6';
      ctx.fillRect(12, 6, 4, 34);
      ctx.fillStyle = '#e6edf5';
      ctx.fillRect(12, 6, 2, 34);

      // Crossguard & pommel
      ctx.fillStyle = '#8f6826';
      ctx.fillRect(7, 40, 14, 3);
      ctx.fillStyle = '#422813';
      ctx.fillRect(12, 43, 4, 7);
      ctx.fillStyle = '#8f6826';
      ctx.fillRect(11, 50, 6, 3);

      this.storeTexture('icon_sword_short', canvas);
    }

    // 6. Broadsword (2x2: 56 x 56)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL * 2;
      canvas.height = CELL * 2;
      const ctx = canvas.getContext('2d')!;

      // Heavy diagonal broadsword
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#c5ccd6';
      ctx.beginPath();
      ctx.moveTo(14, 46);
      ctx.lineTo(44, 10);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(14, 46);
      ctx.lineTo(44, 10);
      ctx.stroke();

      // Guard
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(12, 36);
      ctx.lineTo(24, 46);
      ctx.stroke();

      this.storeTexture('icon_sword_broad', canvas);
    }

    // 7. Heater Shield (2x2: 56 x 56)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL * 2;
      canvas.height = CELL * 2;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#7a1a1a';
      ctx.beginPath();
      ctx.moveTo(10, 8);
      ctx.lineTo(46, 8);
      ctx.lineTo(44, 34);
      ctx.lineTo(28, 50);
      ctx.lineTo(12, 34);
      ctx.closePath();
      ctx.fill();

      // Golden rim
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Golden cross
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(26, 12, 4, 30);
      ctx.fillRect(16, 20, 24, 4);

      this.storeTexture('icon_shield_heater', canvas);
    }

    // 8. Iron Helm (2x2: 56 x 56)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL * 2;
      canvas.height = CELL * 2;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#7a8291';
      ctx.beginPath();
      ctx.arc(28, 28, 18, Math.PI, 0);
      ctx.lineTo(44, 42);
      ctx.lineTo(12, 42);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2b2e36';
      ctx.stroke();

      // Eye slits
      ctx.fillStyle = '#000000';
      ctx.fillRect(18, 30, 8, 3);
      ctx.fillRect(30, 30, 8, 3);

      this.storeTexture('icon_helm_iron', canvas);
    }

    // 9. Full Plate Mail (2x3: 56 x 84)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL * 2;
      canvas.height = CELL * 3;
      const ctx = canvas.getContext('2d')!;

      // Steel cuirass
      ctx.fillStyle = '#767d8a';
      ctx.beginPath();
      ctx.moveTo(14, 12);
      ctx.lineTo(42, 12);
      ctx.lineTo(48, 36);
      ctx.lineTo(44, 76);
      ctx.lineTo(12, 76);
      ctx.lineTo(8, 36);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#32363d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Breastplate ribbing & gold trim
      ctx.fillStyle = '#9aa1ad';
      ctx.fillRect(20, 16, 16, 24);
      ctx.strokeStyle = '#c4a749';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 16, 16, 24);

      this.storeTexture('icon_armor_plate', canvas);
    }

    // 10. The Butcher's Cleaver (2x3: 56 x 84)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL * 2;
      canvas.height = CELL * 3;
      const ctx = canvas.getContext('2d')!;

      // Massive jagged cleaver
      ctx.fillStyle = '#8a93a1';
      ctx.fillRect(14, 10, 28, 46);

      // Serrated edge & blood stains
      ctx.fillStyle = '#8f0e0e';
      ctx.fillRect(38, 10, 5, 46);
      ctx.fillRect(20, 24, 12, 16);

      // Sturdy handle
      ctx.fillStyle = '#3d2013';
      ctx.fillRect(24, 56, 8, 22);

      // Jagged notches
      ctx.fillStyle = '#000000';
      ctx.fillRect(40, 20, 4, 3);
      ctx.fillRect(40, 35, 4, 3);

      this.storeTexture('icon_butcher_cleaver', canvas);
    }

    // 11. Magic Ring (1x1)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL;
      canvas.height = CELL;
      const ctx = canvas.getContext('2d')!;

      ctx.beginPath();
      ctx.arc(14, 15, 7, 0, Math.PI * 2);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Ruby gem
      ctx.fillStyle = '#d4112e';
      ctx.fillRect(12, 6, 4, 4);

      this.storeTexture('icon_ring', canvas);
    }

    // 12. Amulet (1x1)
    {
      const canvas = document.createElement('canvas');
      canvas.width = CELL;
      canvas.height = CELL;
      const ctx = canvas.getContext('2d')!;

      // Golden chain
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(14, 10, 7, 0, Math.PI);
      ctx.stroke();

      // Sapphire talisman
      ctx.fillStyle = '#1c66d9';
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(20, 20);
      ctx.lineTo(14, 26);
      ctx.lineTo(8, 20);
      ctx.closePath();
      ctx.fill();

      this.storeTexture('icon_amulet', canvas);
    }
  }

  // ==========================================
  // UI ELEMENTS & ORBS
  // ==========================================
  private static createUIElements(): void {
    // 1. Health Globe Frame & Fluid (80x80)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 80;
      canvas.height = 80;
      const ctx = canvas.getContext('2d')!;

      // Glass sphere with dark blood fluid
      ctx.beginPath();
      ctx.arc(40, 40, 34, 0, Math.PI * 2);
      ctx.fillStyle = '#7a0000';
      ctx.fill();

      // Glass sphere rim
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#38343f';
      ctx.stroke();

      // Gargoyle / Skull bezel mount
      ctx.strokeStyle = '#18161c';
      ctx.lineWidth = 4;
      ctx.stroke();

      this.storeTexture('ui_globe_health_empty', canvas);
    }

    // 2. Health Fluid Texture (to mask or fill)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 70;
      canvas.height = 70;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createRadialGradient(28, 24, 4, 35, 35, 35);
      grad.addColorStop(0, '#ff4747');
      grad.addColorStop(0.5, '#ba0b0b');
      grad.addColorStop(1, '#520000');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(35, 35, 34, 0, Math.PI * 2);
      ctx.fill();

      this.storeTexture('ui_globe_health_fluid', canvas);
    }

    // 3. Mana Fluid Texture
    {
      const canvas = document.createElement('canvas');
      canvas.width = 70;
      canvas.height = 70;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createRadialGradient(28, 24, 4, 35, 35, 35);
      grad.addColorStop(0, '#59a2ff');
      grad.addColorStop(0.5, '#1254ba');
      grad.addColorStop(1, '#051952');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(35, 35, 34, 0, Math.PI * 2);
      ctx.fill();

      this.storeTexture('ui_globe_mana_fluid', canvas);
    }

    // 4. Inventory Grid Cell (32x32)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#17151a';
      ctx.fillRect(0, 0, 32, 32);

      ctx.strokeStyle = '#2b2733';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, 30, 30);

      this.storeTexture('ui_grid_cell', canvas);
    }

    // 5. Gothic Panel Frame (64x64 sliceable or repeatable)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#121114';
      ctx.fillRect(0, 0, 64, 64);

      ctx.strokeStyle = '#473d2b'; // antique bronze border
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 60, 60);

      ctx.strokeStyle = '#1a1610';
      ctx.strokeRect(5, 5, 54, 54);

      this.storeTexture('ui_panel_bg', canvas);
    }
  }
}
