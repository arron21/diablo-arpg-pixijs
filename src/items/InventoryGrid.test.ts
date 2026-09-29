import { describe, it, expect } from 'vitest';
import { InventoryGrid } from './InventoryGrid';
import { AffixGenerator } from './AffixGenerator';

describe('InventoryGrid', () => {
  it('should place 1x1, 2x2, and 2x3 items without out-of-bounds error', () => {
    const grid = new InventoryGrid();
    const potion = AffixGenerator.createHealthPotion(); // 1x1
    const broadsword = AffixGenerator.createBroadsword(); // 2x2
    const plateArmor = AffixGenerator.createPlateArmor(); // 2x3

    expect(grid.canPlace(potion, 0, 0)).toBe(true);
    expect(grid.placeItem(potion, 0, 0)).toBe(true);

    expect(grid.canPlace(broadsword, 1, 0)).toBe(true);
    expect(grid.placeItem(broadsword, 1, 0)).toBe(true);

    expect(grid.canPlace(plateArmor, 3, 0)).toBe(true);
    expect(grid.placeItem(plateArmor, 3, 0)).toBe(true);

    // Bounding checks: 2x3 item at row 2 cannot fit (2 + 3 > 4 rows)
    const butcherCleaver = AffixGenerator.createButchersCleaver(); // 2x3
    expect(grid.canPlace(butcherCleaver, 5, 2)).toBe(false);
  });

  it('should detect collision when placing overlapping items', () => {
    const grid = new InventoryGrid();
    const helm = AffixGenerator.createIronHelm(); // 2x2
    grid.placeItem(helm, 2, 1);

    // Overlapping 1x1 potion at (2, 1) or (3, 2)
    const potion = AffixGenerator.createHealthPotion();
    expect(grid.canPlace(potion, 2, 1)).toBe(false);
    expect(grid.canPlace(potion, 3, 2)).toBe(false);
    // Non-overlapping at (4, 1)
    expect(grid.canPlace(potion, 4, 1)).toBe(true);
  });

  it('should merge gold stacks up to 5000 and calculate total gold', () => {
    const grid = new InventoryGrid();
    grid.autoPlace(AffixGenerator.createGoldPile(2000));
    expect(grid.getTotalGold()).toBe(2000);

    grid.autoPlace(AffixGenerator.createGoldPile(2500));
    // Merged into single 4500 stack
    expect(grid.getTotalGold()).toBe(4500);
    expect(grid.getAllItems().length).toBe(1);

    // Add another 1000 gold -> fills to 5000 and spills 500 into second stack
    grid.autoPlace(AffixGenerator.createGoldPile(1000));
    expect(grid.getTotalGold()).toBe(5500);
    expect(grid.getAllItems().length).toBe(2);

    // Spend gold
    expect(grid.spendGold(1500)).toBe(true);
    expect(grid.getTotalGold()).toBe(4000);
  });
});
