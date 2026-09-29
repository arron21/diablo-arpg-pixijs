import { Item, ItemType, ItemStats } from './ItemTypes';

export type EquipmentSlot =
  | 'HEAD'
  | 'TORSO'
  | 'MAIN_HAND'
  | 'OFF_HAND'
  | 'AMULET'
  | 'RING_LEFT'
  | 'RING_RIGHT';

export class EquipmentDoll {
  private slots: Map<EquipmentSlot, Item | null> = new Map([
    ['HEAD', null],
    ['TORSO', null],
    ['MAIN_HAND', null],
    ['OFF_HAND', null],
    ['AMULET', null],
    ['RING_LEFT', null],
    ['RING_RIGHT', null]
  ]);

  public canEquip(slot: EquipmentSlot, item: Item): boolean {
    switch (slot) {
      case 'HEAD':
        return item.type === ItemType.HELM;
      case 'TORSO':
        return item.type === ItemType.ARMOR;
      case 'MAIN_HAND':
        return item.type === ItemType.WEAPON;
      case 'OFF_HAND':
        return item.type === ItemType.SHIELD;
      case 'AMULET':
        return item.type === ItemType.AMULET;
      case 'RING_LEFT':
      case 'RING_RIGHT':
        return item.type === ItemType.RING;
      default:
        return false;
    }
  }

  public equip(slot: EquipmentSlot, item: Item): Item | null {
    if (!this.canEquip(slot, item)) {
      return null;
    }
    const previous = this.slots.get(slot) || null;
    this.slots.set(slot, item);
    return previous;
  }

  public unequip(slot: EquipmentSlot): Item | null {
    const item = this.slots.get(slot) || null;
    this.slots.set(slot, null);
    return item;
  }

  public getItem(slot: EquipmentSlot): Item | null {
    return this.slots.get(slot) || null;
  }

  public getAllEquipped(): { slot: EquipmentSlot; item: Item }[] {
    const res: { slot: EquipmentSlot; item: Item }[] = [];
    for (const [slot, item] of this.slots.entries()) {
      if (item !== null) {
        res.push({ slot, item });
      }
    }
    return res;
  }

  public calculateTotalStats(): ItemStats {
    const total: any = {
      minDamage: 0,
      maxDamage: 0,
      armorClass: 0,
      toHit: 0,
      strength: 0,
      dexterity: 0,
      magic: 0,
      vitality: 0,
      maxHp: 0,
      maxMana: 0,
      lightRadius: 0,
      baseBlockChance: 0
    };

    for (const item of this.slots.values()) {
      if (!item) continue;
      for (const [key, value] of Object.entries(item.stats)) {
        if (value !== undefined) {
          total[key] = (total[key] || 0) + value;
        }
      }
    }

    return total as ItemStats;
  }
}
