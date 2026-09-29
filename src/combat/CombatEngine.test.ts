import { describe, it, expect } from 'vitest';
import { CombatEngine, CombatStats } from './CombatEngine';

describe('CombatEngine', () => {
  const dummyAttacker: CombatStats = {
    level: 1,
    strength: 30,
    dexterity: 20,
    magic: 10,
    vitality: 25,
    maxHp: 80,
    currentHp: 80,
    maxMana: 20,
    currentMana: 20,
    toHit: 10,
    armorClass: 15,
    minDamage: 4,
    maxDamage: 8,
    hasShield: false,
    baseBlockChance: 0,
    lightRadiusBonus: 0,
    fasterHitRecovery: 0,
    fasterAttackSpeed: 0
  };

  const dummyTarget: CombatStats = {
    ...dummyAttacker,
    armorClass: 20,
    hasShield: true,
    baseBlockChance: 25
  };

  it('should clamp hit chance between 5% and 95%', () => {
    // Extremely high AC target -> clamp to 5%
    const impossibleHit = CombatEngine.calculateHitChance(
      dummyAttacker,
      { ...dummyTarget, armorClass: 500 }
    );
    expect(impossibleHit).toBe(5);

    // Guaranteed hit -> clamp to 95%
    const guaranteedHit = CombatEngine.calculateHitChance(
      { ...dummyAttacker, toHit: 500, dexterity: 100 },
      { ...dummyTarget, armorClass: 0 }
    );
    expect(guaranteedHit).toBe(95);
  });

  it('should calculate shield block chance properly', () => {
    const blockChance = CombatEngine.calculateBlockChance(dummyTarget, 1);
    // 25 base + 10 (dex/2) - 2 (lvl*2) = 33%
    expect(blockChance).toBe(33);

    // No shield should always be 0%
    const noShieldBlock = CombatEngine.calculateBlockChance(
      { ...dummyTarget, hasShield: false },
      1
    );
    expect(noShieldBlock).toBe(0);
  });

  it('should trigger hit recovery when damage exceeds 15% of max HP', () => {
    const targetWith100HP: CombatStats = {
      ...dummyTarget,
      maxHp: 100,
      currentHp: 100
    };

    // 15 damage on 100 max HP triggers hit recovery
    const hitStatsHigh: CombatStats = {
      ...dummyAttacker,
      toHit: 999,
      minDamage: 25,
      maxDamage: 25
    };

    const res = CombatEngine.resolveAttack(hitStatsHigh, { ...targetWith100HP, hasShield: false });
    expect(res.isHit).toBe(true);
    expect(res.triggersHitRecovery).toBe(true);
  });
});
