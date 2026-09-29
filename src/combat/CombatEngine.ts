export interface CombatStats {
  level: number;
  strength: number;
  dexterity: number;
  magic: number;
  vitality: number;

  maxHp: number;
  currentHp: number;
  maxMana: number;
  currentMana: number;

  toHit: number;          // e.g. 0 to 50
  armorClass: number;     // e.g. 10 to 80
  minDamage: number;      // e.g. 4
  maxDamage: number;      // e.g. 10

  hasShield: boolean;
  baseBlockChance: number;// e.g. 30%
  lightRadiusBonus: number;
  fasterHitRecovery: number; // percentage reduction
  fasterAttackSpeed: number; // percentage reduction
}

export interface AttackResult {
  isHit: boolean;
  isBlocked: boolean;
  damage: number;
  triggersHitRecovery: boolean;
}

export class CombatEngine {
  /**
   * Calculates Diablo 1 Chance to Hit:
   * HitChance = clamp(50 + ToHit + Dex/2 - TargetAC, 5%, 95%)
   */
  public static calculateHitChance(attacker: CombatStats, target: CombatStats): number {
    const rawChance = 50 + attacker.toHit + Math.floor(attacker.dexterity / 2) - target.armorClass;
    return Math.max(5, Math.min(95, rawChance));
  }

  /**
   * Calculates Diablo 1 Shield Block Chance:
   * BlockChance = clamp(BaseBlock + Dex/2 - AttackerLevel * 2, 0%, 75%)
   */
  public static calculateBlockChance(target: CombatStats, attackerLevel: number): number {
    if (!target.hasShield) return 0;
    const rawBlock = target.baseBlockChance + Math.floor(target.dexterity / 2) - attackerLevel * 2;
    return Math.max(0, Math.min(75, rawBlock));
  }

  /**
   * Resolves a full attack roll from attacker against target.
   */
  public static resolveAttack(attacker: CombatStats, target: CombatStats): AttackResult {
    // 1. Roll To-Hit
    const hitChance = this.calculateHitChance(attacker, target);
    const hitRoll = Math.random() * 100;
    if (hitRoll > hitChance) {
      return {
        isHit: false,
        isBlocked: false,
        damage: 0,
        triggersHitRecovery: false
      };
    }

    // 2. Roll Shield Block
    const blockChance = this.calculateBlockChance(target, attacker.level);
    const blockRoll = Math.random() * 100;
    if (blockRoll <= blockChance) {
      return {
        isHit: true,
        isBlocked: true,
        damage: 0,
        triggersHitRecovery: false
      };
    }

    // 3. Roll Damage
    const weaponRoll = attacker.minDamage + Math.floor(Math.random() * (attacker.maxDamage - attacker.minDamage + 1));
    const strBonus = 1 + attacker.strength / 100;
    const rawDamage = Math.floor(weaponRoll * strBonus);

    // Armor damage reduction
    const damageReduction = Math.floor(target.armorClass * 0.15);
    const finalDamage = Math.max(1, rawDamage - damageReduction);

    // 4. Hit Recovery: Triggers if damage >= 15% of max HP
    const triggersHitRecovery = finalDamage >= Math.floor(target.maxHp * 0.15);

    return {
      isHit: true,
      isBlocked: false,
      damage: finalDamage,
      triggersHitRecovery
    };
  }

  /**
   * Calculates experience required for next level.
   */
  public static getNextLevelExp(level: number): number {
    return Math.floor(level * 1000 * 1.5);
  }
}
