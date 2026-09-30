import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { EquipmentDoll } from './EquipmentDoll';
import { GroundItemManager } from './GroundItemManager';
import { AffixGenerator } from './AffixGenerator';

describe('EquipmentDoll', () => {
  it('should equip, unequip, and swap items according to slot restrictions', () => {
    const doll = new EquipmentDoll();
    const swordA = AffixGenerator.createBroadsword(); // WEAPON
    const swordB = AffixGenerator.createBroadsword(); // WEAPON
    const helm = AffixGenerator.createIronHelm();     // HELM

    // Slot type checks
    expect(doll.canEquip('MAIN_HAND', swordA)).toBe(true);
    expect(doll.canEquip('TORSO', swordA)).toBe(false);
    expect(doll.canEquip('HEAD', helm)).toBe(true);

    // Initial equip
    const prevInitial = doll.equip('MAIN_HAND', swordA);
    expect(prevInitial).toBeNull();
    expect(doll.getItem('MAIN_HAND')?.id).toBe(swordA.id);

    // Swap equipped weapon with sword B
    const swapped = doll.equip('MAIN_HAND', swordB);
    expect(swapped?.id).toBe(swordA.id);
    expect(doll.getItem('MAIN_HAND')?.id).toBe(swordB.id);

    // Unequip
    const unequipped = doll.unequip('MAIN_HAND');
    expect(unequipped?.id).toBe(swordB.id);
    expect(doll.getItem('MAIN_HAND')).toBeNull();
  });
});

describe('GroundItemManager', () => {
  it('should respect pickup cooldown when dropped', () => {
    const stage = new Container();
    const manager = new GroundItemManager(stage);
    const potion = AffixGenerator.createHealthPotion();

    // Drop item with 2000ms cooldown
    const groundItem = manager.dropItem(potion, 5, 5, 2000);
    expect(groundItem.canPickupAfter).toBeGreaterThan(Date.now());

    // Should NOT be returned by getItemsNear if cooldown active
    const nearWithCooldown = manager.getItemsNear(5, 5, 1.0);
    expect(nearWithCooldown.length).toBe(0);

    // Should be returned when ignoring cooldown (e.g. manual click)
    const nearIgnoring = manager.getItemsNear(5, 5, 1.0, true);
    expect(nearIgnoring.length).toBe(1);
    expect(nearIgnoring[0].item.id).toBe(potion.id);

    // When cooldown expires or is cleared:
    groundItem.canPickupAfter = 0;
    const nearExpired = manager.getItemsNear(5, 5, 1.0);
    expect(nearExpired.length).toBe(1);

    // Clean up
    manager.removeItem(groundItem);
    expect(manager.getAllItems().length).toBe(0);
  });
});
