import { Entity, ActionState } from './Entity';
import { CombatStats, CombatEngine } from '../combat/CombatEngine';
import { InventoryGrid } from '../items/InventoryGrid';
import { EquipmentDoll } from '../items/EquipmentDoll';
import { Belt } from '../items/Belt';
import { AffixGenerator } from '../items/AffixGenerator';
import { AssetFactory } from '../graphics/AssetFactory';
import { GridCoord } from '../engine/IsoMath';
import { DungeonLevel, DungeonGenerator } from '../world/DungeonGenerator';

export class Player extends Entity {
  public inventory: InventoryGrid;
  public equipment: EquipmentDoll;
  public belt: Belt;

  // Progression
  public currentXp: number = 0;
  public nextLevelXp: number = 1000;
  public unspentStatPoints: number = 0;

  // Movement & Navigation
  public currentPath: GridCoord[] = [];
  public targetEntity: Entity | null = null;
  public moveSpeed: number = 4.2; // tiles per second

  // Combat frame timing
  public attackDurationMs: number = 320;
  public attackTimer: number = 0;
  public attackHitTriggered: boolean = false;
  public onAttackHit?: (target: Entity | null) => void;

  public blockDurationMs: number = 220;
  public blockTimer: number = 0;

  public hitRecoveryDurationMs: number = 260;
  public hitRecoveryTimer: number = 0;

  // Sound event hooks
  public onSoundTrigger?: (soundKey: string) => void;

  constructor(gx: number, gy: number) {
    const baseStats: CombatStats = {
      level: 1,
      strength: 30,
      dexterity: 20,
      magic: 10,
      vitality: 25,
      maxHp: 80,
      currentHp: 80,
      maxMana: 25,
      currentMana: 25,
      toHit: 10,
      armorClass: 15,
      minDamage: 4,
      maxDamage: 8,
      hasShield: true,
      baseBlockChance: 25,
      lightRadiusBonus: 0,
      fasterHitRecovery: 0,
      fasterAttackSpeed: 0
    };

    super('player_warrior', gx, gy, baseStats);

    this.inventory = new InventoryGrid();
    this.equipment = new EquipmentDoll();
    this.belt = new Belt();

    this.setupStartingGear();
    this.recalculateStats();
    this.updateSpriteTexture();
  }

  private setupStartingGear(): void {
    const startSword = AffixGenerator.createBroadsword();
    const startShield = AffixGenerator.createHeaterShield();
    const startHelm = AffixGenerator.createIronHelm();

    this.equipment.equip('MAIN_HAND', startSword);
    this.equipment.equip('OFF_HAND', startShield);
    this.equipment.equip('HEAD', startHelm);

    // Initial belt potions
    this.belt.setSlot(0, AffixGenerator.createHealthPotion());
    this.belt.setSlot(1, AffixGenerator.createHealthPotion());
    this.belt.setSlot(2, AffixGenerator.createManaPotion());
    this.belt.setSlot(3, AffixGenerator.createTownPortalScroll());

    // Starting gold
    this.inventory.autoPlace(AffixGenerator.createGoldPile(250));
  }

  public recalculateStats(): void {
    const equipStats = this.equipment.calculateTotalStats();

    // Max HP: 50 + Vitality * 2 + gear
    const maxHp = 50 + this.stats.vitality * 2 + (equipStats.maxHp || 0);
    const hpRatio = this.stats.currentHp / (this.stats.maxHp || maxHp);
    this.stats.maxHp = maxHp;
    this.stats.currentHp = Math.min(maxHp, Math.max(1, Math.floor(hpRatio * maxHp)));

    // Max Mana: 10 + Magic * 1.5 + gear
    const maxMana = 10 + Math.floor(this.stats.magic * 1.5) + (equipStats.maxMana || 0);
    const manaRatio = this.stats.currentMana / (this.stats.maxMana || maxMana);
    this.stats.maxMana = maxMana;
    this.stats.currentMana = Math.min(maxMana, Math.floor(manaRatio * maxMana));

    // To-Hit: 10 + Dex / 2 + gear
    this.stats.toHit = 10 + Math.floor(this.stats.dexterity / 2) + (equipStats.toHit || 0);

    // Armor Class: Dex / 5 + gear
    this.stats.armorClass = Math.floor(this.stats.dexterity / 5) + (equipStats.armorClass || 0);

    // Weapon Damage:
    this.stats.minDamage = Math.max(1, (equipStats.minDamage || 2));
    this.stats.maxDamage = Math.max(2, (equipStats.maxDamage || 6));

    // Shield & Block:
    const offHand = this.equipment.getItem('OFF_HAND');
    this.stats.hasShield = offHand !== null;
    this.stats.baseBlockChance = equipStats.baseBlockChance || (this.stats.hasShield ? 20 : 0);

    // Light radius
    this.stats.lightRadiusBonus = equipStats.lightRadius || 0;
  }

  public addExperience(xp: number): boolean {
    this.currentXp += xp;
    if (this.currentXp >= this.nextLevelXp) {
      this.levelUp();
      return true;
    }
    return false;
  }

  private levelUp(): void {
    this.stats.level++;
    this.unspentStatPoints += 5;
    this.nextLevelXp += CombatEngine.getNextLevelExp(this.stats.level);

    // Full restore on level up
    this.stats.currentHp = this.stats.maxHp;
    this.stats.currentMana = this.stats.maxMana;

    this.onSoundTrigger?.('level_up');
  }

  public allocateStat(statName: 'strength' | 'dexterity' | 'magic' | 'vitality'): boolean {
    if (this.unspentStatPoints <= 0) return false;
    this.stats[statName]++;
    this.unspentStatPoints--;
    this.recalculateStats();
    return true;
  }

  public triggerAttack(target: Entity | null): boolean {
    if (this.state === ActionState.ATTACK || this.state === ActionState.HIT_RECOVERY || this.state === ActionState.DEAD) {
      return false;
    }

    this.state = ActionState.ATTACK;
    this.targetEntity = target;
    this.attackTimer = this.attackDurationMs;
    this.attackHitTriggered = false;
    this.currentPath = []; // Stop moving when swinging

    this.onSoundTrigger?.('sword_swing');
    this.updateSpriteTexture();
    return true;
  }

  public triggerBlock(): void {
    if (this.state === ActionState.DEAD) return;
    this.state = ActionState.BLOCK;
    this.blockTimer = this.blockDurationMs;
    this.onSoundTrigger?.('shield_block');
    this.updateSpriteTexture();
  }

  public triggerHitRecovery(): void {
    if (this.state === ActionState.DEAD) return;
    this.state = ActionState.HIT_RECOVERY;
    this.hitRecoveryTimer = this.hitRecoveryDurationMs;
    this.currentPath = [];
    this.onSoundTrigger?.('hit_flesh');
    this.updateSpriteTexture();
  }

  public heal(amount: number): void {
    this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + amount);
  }

  public restoreMana(amount: number): void {
    this.stats.currentMana = Math.min(this.stats.maxMana, this.stats.currentMana + amount);
  }

  public useBeltSlot(index: number): boolean {
    const item = this.belt.useSlot(index);
    if (!item) return false;

    if (item.stats.maxHp) {
      this.heal(item.stats.maxHp);
      this.onSoundTrigger?.('potion_gulp');
      return true;
    }
    if (item.stats.maxMana) {
      this.restoreMana(item.stats.maxMana);
      this.onSoundTrigger?.('potion_gulp');
      return true;
    }
    return false;
  }

  public update(deltaMs: number): void {
    if (this.state === ActionState.DEAD) return;

    // 1. Handle Hit Recovery stun timer
    if (this.state === ActionState.HIT_RECOVERY) {
      this.hitRecoveryTimer -= deltaMs;
      if (this.hitRecoveryTimer <= 0) {
        this.state = ActionState.IDLE;
        this.updateSpriteTexture();
      }
      return;
    }

    // 2. Handle Shield Block animation
    if (this.state === ActionState.BLOCK) {
      this.blockTimer -= deltaMs;
      if (this.blockTimer <= 0) {
        this.state = ActionState.IDLE;
        this.updateSpriteTexture();
      }
      return;
    }

    // 3. Handle Attack animation
    if (this.state === ActionState.ATTACK) {
      this.attackTimer -= deltaMs;
      const progress = 1 - Math.max(0, this.attackTimer / this.attackDurationMs);

      // Hit occurs halfway through swing
      if (progress >= 0.5 && !this.attackHitTriggered) {
        this.attackHitTriggered = true;
        this.onAttackHit?.(this.targetEntity);
      }

      if (this.attackTimer <= 0) {
        this.state = ActionState.IDLE;
        this.updateSpriteTexture();
      } else {
        // Toggle swing frames
        const frame = progress < 0.5 ? 0 : 1;
        if (frame !== this.animFrame) {
          this.animFrame = frame;
          this.updateSpriteTexture();
        }
      }
      return;
    }

    // 4. Handle Path Movement
    if (this.currentPath.length > 0) {
      const nextStep = this.currentPath[0];
      const targetX = nextStep.gx + 0.5;
      const targetY = nextStep.gy + 0.5;

      const dx = targetX - this.gx;
      const dy = targetY - this.gy;
      const dist = Math.hypot(dx, dy);

      this.setDirectionFromDelta(dx, dy);

      const stepDist = (this.moveSpeed * deltaMs) / 1000;
      if (stepDist >= dist) {
        this.gx = targetX;
        this.gy = targetY;
        this.currentPath.shift();
      } else {
        this.gx += (dx / dist) * stepDist;
        this.gy += (dy / dist) * stepDist;
      }

      this.state = ActionState.WALK;
      this.animTimer += deltaMs;
      if (this.animTimer > 180) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
        this.onSoundTrigger?.('footstep');
      }

      this.updateScreenPosition();
      this.updateSpriteTexture();

      // Check if target monster is within attack range
      if (this.targetEntity && this.targetEntity.state !== ActionState.DEAD) {
        const monsterDist = Math.hypot(this.targetEntity.gx - this.gx, this.targetEntity.gy - this.gy);
        if (monsterDist <= 1.4) {
          this.triggerAttack(this.targetEntity);
        }
      }
    } else {
      if (this.state === ActionState.WALK) {
        this.state = ActionState.IDLE;
        this.updateSpriteTexture();
      }
    }
  }

  public moveByWasd(moveX: number, moveY: number, deltaMs: number, dungeon: DungeonLevel): void {
    if (this.state === ActionState.ATTACK || this.state === ActionState.HIT_RECOVERY || this.state === ActionState.DEAD) {
      return;
    }

    this.currentPath = []; // Manual WASD overrides auto-path
    const stepDist = (this.moveSpeed * deltaMs) / 1000;
    const nextGx = this.gx + moveX * stepDist;
    const nextGy = this.gy + moveY * stepDist;

    // Check collision with tile
    const tileX = Math.floor(nextGx);
    const tileY = Math.floor(nextGy);
    if (tileX >= 0 && tileX < dungeon.width && tileY >= 0 && tileY < dungeon.height) {
      if (DungeonGenerator.isWalkable(dungeon.tiles[tileY][tileX])) {
        this.gx = nextGx;
        this.gy = nextGy;
        this.setDirectionFromDelta(moveX, moveY);
        this.state = ActionState.WALK;
        this.animTimer += deltaMs;
        if (this.animTimer > 180) {
          this.animTimer = 0;
          this.animFrame = (this.animFrame + 1) % 2;
          this.onSoundTrigger?.('footstep');
        }
        this.updateScreenPosition();
        this.updateSpriteTexture();
      }
    }
  }

  public updateSpriteTexture(): void {
    let textureKey = '';
    switch (this.state) {
      case ActionState.IDLE:
        textureKey = `warrior_idle_dir${this.direction}`;
        break;
      case ActionState.WALK:
        textureKey = `warrior_walk_${this.animFrame}_dir${this.direction}`;
        break;
      case ActionState.ATTACK:
        textureKey = `warrior_attack_${this.animFrame}_dir${this.direction}`;
        break;
      case ActionState.BLOCK:
        textureKey = `warrior_block_dir${this.direction}`;
        break;
      case ActionState.HIT_RECOVERY:
        textureKey = `warrior_hit_dir${this.direction}`;
        break;
      case ActionState.DEAD:
        textureKey = `warrior_dead_dir${this.direction}`;
    }

    if (AssetFactory.hasTexture(textureKey)) {
      this.sprite.texture = AssetFactory.getTexture(textureKey);
    }
  }

  public respawn(gx: number, gy: number): void {
    this.gx = gx;
    this.gy = gy;
    this.currentPath = [];
    this.targetEntity = null;
    this.stats.currentHp = this.stats.maxHp;
    this.stats.currentMana = this.stats.maxMana;
    this.state = ActionState.IDLE;
    this.direction = 0;
    this.animFrame = 0;
    this.updateScreenPosition();
    this.updateSpriteTexture();
  }
}
