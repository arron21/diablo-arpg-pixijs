import { Entity, ActionState } from './Entity';
import { CombatStats } from '../combat/CombatEngine';
import { AssetFactory } from '../graphics/AssetFactory';
import { GridCoord } from '../engine/IsoMath';
import { DungeonLevel } from '../world/DungeonGenerator';
import { Pathfinding } from '../world/Pathfinding';
import { Item } from '../items/ItemTypes';
import { AffixGenerator } from '../items/AffixGenerator';

export enum MonsterType {
  SKELETON = 'skeleton',
  ARCHER = 'archer',
  FALLEN = 'fallen',
  BUTCHER = 'butcher'
}

export class Monster extends Entity {
  public monsterType: MonsterType;
  public name: string;
  public xpReward: number;

  // AI State
  public isAlerted: boolean = false;
  public currentPath: GridCoord[] = [];
  public pathTimer: number = 0;
  public moveSpeed: number = 2.8;

  // Attack timer
  public attackCooldown: number = 0;
  public attackDuration: number = 350;
  public attackTimer: number = 0;
  public onAttackHit?: (target: Entity) => void;

  // Special Behaviors
  public isPanicking: boolean = false;
  public panicTimer: number = 0;

  // Butcher boss speech
  public hasTaunted: boolean = false;

  // Sound trigger
  public onSoundTrigger?: (soundKey: string) => void;

  constructor(type: MonsterType, gx: number, gy: number, level: number = 1) {
    let stats: CombatStats;
    let name = '';
    let xpReward = 50;
    let speed = 2.8;

    switch (type) {
      case MonsterType.SKELETON:
        name = 'Skeleton Warrior';
        stats = {
          level,
          strength: 15,
          dexterity: 15,
          magic: 0,
          vitality: 10,
          maxHp: 28 + level * 8,
          currentHp: 28 + level * 8,
          maxMana: 0,
          currentMana: 0,
          toHit: 15,
          armorClass: 8 + level * 2,
          minDamage: 2 + level,
          maxDamage: 6 + level * 2,
          hasShield: false,
          baseBlockChance: 0,
          lightRadiusBonus: 0,
          fasterHitRecovery: 0,
          fasterAttackSpeed: 0
        };
        xpReward = 60 + level * 20;
        speed = 2.6;
        break;

      case MonsterType.ARCHER:
        name = 'Skeleton Archer';
        stats = {
          level,
          strength: 10,
          dexterity: 25,
          magic: 0,
          vitality: 8,
          maxHp: 20 + level * 6,
          currentHp: 20 + level * 6,
          maxMana: 0,
          currentMana: 0,
          toHit: 25,
          armorClass: 5 + level,
          minDamage: 2 + level,
          maxDamage: 5 + level * 2,
          hasShield: false,
          baseBlockChance: 0,
          lightRadiusBonus: 0,
          fasterHitRecovery: 0,
          fasterAttackSpeed: 0
        };
        xpReward = 75 + level * 20;
        speed = 2.4;
        break;

      case MonsterType.FALLEN:
        name = 'Fallen Imp';
        stats = {
          level,
          strength: 8,
          dexterity: 18,
          magic: 0,
          vitality: 6,
          maxHp: 16 + level * 5,
          currentHp: 16 + level * 5,
          maxMana: 0,
          currentMana: 0,
          toHit: 20,
          armorClass: 4 + level,
          minDamage: 1 + level,
          maxDamage: 4 + level,
          hasShield: false,
          baseBlockChance: 0,
          lightRadiusBonus: 0,
          fasterHitRecovery: 0,
          fasterAttackSpeed: 0
        };
        xpReward = 40 + level * 15;
        speed = 3.6; // Very fast skittering
        break;

      case MonsterType.BUTCHER:
        name = 'The Butcher';
        stats = {
          level: 3,
          strength: 50,
          dexterity: 25,
          magic: 0,
          vitality: 60,
          maxHp: 240,
          currentHp: 240,
          maxMana: 0,
          currentMana: 0,
          toHit: 35,
          armorClass: 25,
          minDamage: 6,
          maxDamage: 20,
          hasShield: false,
          baseBlockChance: 0,
          lightRadiusBonus: 0,
          fasterHitRecovery: 0.5,
          fasterAttackSpeed: 0.2
        };
        xpReward = 1000;
        speed = 4.6; // Terrifying sprint
        break;
    }

    super(`monster_${type}_${Date.now()}_${Math.random()}`, gx, gy, stats);
    this.monsterType = type;
    this.name = name;
    this.xpReward = xpReward;
    this.moveSpeed = speed;

    this.updateSpriteTexture();
  }

  public triggerHitRecovery(): void {
    if (this.state === ActionState.DEAD) return;
    this.state = ActionState.HIT_RECOVERY;
    this.stateTimer = 220;
    this.currentPath = [];
    this.onSoundTrigger?.(this.monsterType === MonsterType.SKELETON ? 'bone_clatter' : 'monster_hit');
    this.updateSpriteTexture();
  }

  public triggerPanic(): void {
    if (this.monsterType === MonsterType.FALLEN && this.state !== ActionState.DEAD) {
      this.isPanicking = true;
      this.panicTimer = 3000; // 3 seconds of screaming panic
      this.onSoundTrigger?.('fallen_panic');
    }
  }

  public die(): Item[] {
    this.state = ActionState.DEAD;
    this.currentPath = [];
    this.updateSpriteTexture();
    this.onSoundTrigger?.(this.monsterType === MonsterType.SKELETON ? 'skeleton_death' : 'monster_death');

    // Boss drop
    if (this.monsterType === MonsterType.BUTCHER) {
      return [
        AffixGenerator.createButchersCleaver(),
        AffixGenerator.createGoldPile(500),
        AffixGenerator.createHealthPotion()
      ];
    }

    // Normal drops
    const drops: Item[] = [];
    if (Math.random() < 0.65) {
      drops.push(AffixGenerator.rollRandomDrop(this.stats.level));
    }
    return drops;
  }

  public updateAI(player: Entity, dungeon: DungeonLevel, deltaMs: number): void {
    if (this.state === ActionState.DEAD) return;

    // Hit recovery timer
    if (this.state === ActionState.HIT_RECOVERY) {
      this.stateTimer -= deltaMs;
      if (this.stateTimer <= 0) {
        this.state = ActionState.IDLE;
        this.updateSpriteTexture();
      }
      return;
    }

    // Attack cooldown and animation
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaMs;
    }

    if (this.state === ActionState.ATTACK) {
      this.attackTimer -= deltaMs;
      if (this.attackTimer <= 0) {
        this.state = ActionState.IDLE;
        this.updateSpriteTexture();
      }
      return;
    }

    // Panic behavior (Fallen)
    if (this.isPanicking) {
      this.panicTimer -= deltaMs;
      if (this.panicTimer <= 0) {
        this.isPanicking = false;
      } else {
        // Run away from player
        const dx = this.gx - player.gx;
        const dy = this.gy - player.gy;
        const dist = Math.hypot(dx, dy) || 1;
        this.setDirectionFromDelta(dx, dy);

        const step = (this.moveSpeed * deltaMs) / 1000;
        this.gx += (dx / dist) * step;
        this.gy += (dy / dist) * step;
        this.state = ActionState.WALK;
        this.updateScreenPosition();
        this.updateSpriteTexture();
        return;
      }
    }

    const distToPlayer = Math.hypot(player.gx - this.gx, player.gy - this.gy);

    // Alert check (within 10 tiles)
    if (!this.isAlerted && distToPlayer <= 9.5) {
      this.isAlerted = true;
      if (this.monsterType === MonsterType.BUTCHER && !this.hasTaunted) {
        this.hasTaunted = true;
        this.onSoundTrigger?.('butcher_shout');
      }
    }

    if (!this.isAlerted) {
      this.state = ActionState.IDLE;
      this.updateSpriteTexture();
      return;
    }

    // ARCHER KITING: If player is too close (< 3 tiles), flee backward
    if (this.monsterType === MonsterType.ARCHER && distToPlayer < 3.2) {
      const fleeX = this.gx - (player.gx - this.gx);
      const fleeY = this.gy - (player.gy - this.gy);
      this.currentPath = Pathfinding.findPath(dungeon, Math.floor(this.gx), Math.floor(this.gy), Math.floor(fleeX), Math.floor(fleeY), 50);
    }
    // MELEE ATTACK: within 1.3 tiles
    else if (distToPlayer <= 1.35) {
      if (this.attackCooldown <= 0) {
        this.state = ActionState.ATTACK;
        this.attackTimer = this.attackDuration;
        this.attackCooldown = 800; // Attack every 800ms
        this.setDirectionFromDelta(player.gx - this.gx, player.gy - this.gy);
        this.updateSpriteTexture();
        this.onAttackHit?.(player);
        this.onSoundTrigger?.(this.monsterType === MonsterType.BUTCHER ? 'butcher_cleaver' : 'monster_claw');
      }
      return;
    }
    // RANGED ATTACK: Archer within 3 to 7 tiles
    else if (this.monsterType === MonsterType.ARCHER && distToPlayer <= 7.0) {
      if (this.attackCooldown <= 0) {
        this.state = ActionState.ATTACK;
        this.attackTimer = this.attackDuration;
        this.attackCooldown = 1200;
        this.setDirectionFromDelta(player.gx - this.gx, player.gy - this.gy);
        this.updateSpriteTexture();
        this.onAttackHit?.(player);
        this.onSoundTrigger?.('arrow_shoot');
      }
      return;
    }
    // CHASE PLAYER: Pathfind toward player
    else {
      this.pathTimer += deltaMs;
      if (this.pathTimer > 400 || this.currentPath.length === 0) {
        this.pathTimer = 0;
        this.currentPath = Pathfinding.findPath(
          dungeon,
          Math.floor(this.gx),
          Math.floor(this.gy),
          Math.floor(player.gx),
          Math.floor(player.gy),
          300
        );
      }
    }

    // Step along path
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
      }
    } else {
      this.state = ActionState.IDLE;
    }

    this.updateScreenPosition();
    this.updateSpriteTexture();
  }

  public update(_deltaMs: number): void {
    // Standard update handled by updateAI
  }

  public updateSpriteTexture(): void {
    let textureKey = '';
    const type = this.monsterType;
    switch (this.state) {
      case ActionState.IDLE:
        textureKey = `${type}_idle_dir${this.direction}`;
        break;
      case ActionState.WALK:
        textureKey = `${type}_walk_${this.animFrame}_dir${this.direction}`;
        break;
      case ActionState.ATTACK:
        textureKey = `${type}_attack_dir${this.direction}`;
        break;
      case ActionState.HIT_RECOVERY:
        textureKey = `${type}_hit_dir${this.direction}`;
        break;
      case ActionState.DEAD:
        textureKey = `${type}_dead_dir${this.direction}`;
        break;
    }

    if (AssetFactory.hasTexture(textureKey)) {
      this.sprite.texture = AssetFactory.getTexture(textureKey);
    }
  }
}
