import { Item, ItemType, ItemQuality } from './ItemTypes';

export class AffixGenerator {
  private static nextId: number = 1;

  public static generateId(): string {
    return `item_${Date.now()}_${this.nextId++}`;
  }

  public static createHealthPotion(): Item {
    return {
      id: this.generateId(),
      name: 'Healing Potion',
      type: ItemType.POTION,
      quality: ItemQuality.NORMAL,
      width: 1,
      height: 1,
      textureKey: 'icon_potion_health',
      stats: { maxHp: 50 },
      goldValue: 50,
      identified: true
    };
  }

  public static createManaPotion(): Item {
    return {
      id: this.generateId(),
      name: 'Mana Potion',
      type: ItemType.POTION,
      quality: ItemQuality.NORMAL,
      width: 1,
      height: 1,
      textureKey: 'icon_potion_mana',
      stats: { maxMana: 35 },
      goldValue: 50,
      identified: true
    };
  }

  public static createTownPortalScroll(): Item {
    return {
      id: this.generateId(),
      name: 'Scroll of Town Portal',
      type: ItemType.SCROLL,
      quality: ItemQuality.NORMAL,
      width: 1,
      height: 1,
      textureKey: 'icon_scroll_portal',
      stats: {},
      goldValue: 100,
      identified: true
    };
  }

  public static createGoldPile(amount: number): Item {
    return {
      id: this.generateId(),
      name: `${amount} Gold`,
      type: ItemType.GOLD,
      quality: ItemQuality.NORMAL,
      width: 1,
      height: 1,
      textureKey: 'icon_gold',
      stats: {},
      goldValue: amount,
      quantity: amount,
      identified: true
    };
  }

  public static createShortSword(): Item {
    return {
      id: this.generateId(),
      name: 'Short Sword',
      type: ItemType.WEAPON,
      quality: ItemQuality.NORMAL,
      width: 1,
      height: 2,
      textureKey: 'icon_sword_short',
      stats: { minDamage: 2, maxDamage: 6 },
      goldValue: 120,
      identified: true
    };
  }

  public static createBroadsword(): Item {
    return {
      id: this.generateId(),
      name: 'Broadsword',
      type: ItemType.WEAPON,
      quality: ItemQuality.NORMAL,
      width: 2,
      height: 2,
      textureKey: 'icon_sword_broad',
      stats: { minDamage: 4, maxDamage: 12, strength: 2 },
      goldValue: 350,
      identified: true
    };
  }

  public static createHeaterShield(): Item {
    return {
      id: this.generateId(),
      name: 'Heater Shield',
      type: ItemType.SHIELD,
      quality: ItemQuality.NORMAL,
      width: 2,
      height: 2,
      textureKey: 'icon_shield_heater',
      stats: { armorClass: 8, baseBlockChance: 25 },
      goldValue: 200,
      identified: true
    };
  }

  public static createIronHelm(): Item {
    return {
      id: this.generateId(),
      name: 'Iron Cap',
      type: ItemType.HELM,
      quality: ItemQuality.NORMAL,
      width: 2,
      height: 2,
      textureKey: 'icon_helm_iron',
      stats: { armorClass: 6 },
      goldValue: 150,
      identified: true
    };
  }

  public static createPlateArmor(): Item {
    return {
      id: this.generateId(),
      name: 'Full Plate Mail',
      type: ItemType.ARMOR,
      quality: ItemQuality.NORMAL,
      width: 2,
      height: 3,
      textureKey: 'icon_armor_plate',
      stats: { armorClass: 25 },
      goldValue: 800,
      identified: true
    };
  }

  public static createButchersCleaver(): Item {
    return {
      id: this.generateId(),
      name: "The Butcher's Cleaver",
      type: ItemType.WEAPON,
      quality: ItemQuality.UNIQUE,
      width: 2,
      height: 3,
      textureKey: 'icon_butcher_cleaver',
      stats: {
        minDamage: 4,
        maxDamage: 24,
        strength: 10,
        vitality: 5
      },
      goldValue: 2500,
      identified: true
    };
  }

  public static rollRandomDrop(monsterLevel: number): Item {
    const roll = Math.random();

    // 40% Gold
    if (roll < 0.4) {
      const amount = 20 + Math.floor(Math.random() * (30 * monsterLevel));
      return this.createGoldPile(amount);
    }
    // 25% Potion
    if (roll < 0.65) {
      return Math.random() < 0.6 ? this.createHealthPotion() : this.createManaPotion();
    }
    // 10% Scroll
    if (roll < 0.75) {
      return this.createTownPortalScroll();
    }

    // 25% Equipment (Weapon / Armor / Shield / Helm)
    const equipRoll = Math.random();
    let baseItem: Item;
    if (equipRoll < 0.3) baseItem = this.createShortSword();
    else if (equipRoll < 0.55) baseItem = this.createBroadsword();
    else if (equipRoll < 0.75) baseItem = this.createHeaterShield();
    else if (equipRoll < 0.9) baseItem = this.createIronHelm();
    else baseItem = this.createPlateArmor();

    // 45% chance to roll magical affixes
    if (Math.random() < 0.45) {
      return this.applyMagicAffixes(baseItem);
    }

    return baseItem;
  }

  private static applyMagicAffixes(item: Item): Item {
    const prefixes = [
      { name: 'Sharp', stats: { toHit: 15 }, costMul: 1.5 },
      { name: "King's", stats: { toHit: 30, maxDamage: 6 }, costMul: 2.5 },
      { name: 'Saintly', stats: { armorClass: 12 }, costMul: 1.6 },
      { name: 'Godly', stats: { armorClass: 25 }, costMul: 2.8 },
    ];

    const suffixes = [
      { name: 'of the Whale', stats: { maxHp: 35 }, costMul: 2.0 },
      { name: 'of the Wolf', stats: { maxHp: 15 }, costMul: 1.4 },
      { name: 'of Light', stats: { lightRadius: 3 }, costMul: 1.3 },
      { name: 'of Might', stats: { strength: 6 }, costMul: 1.5 },
      { name: 'of Precision', stats: { dexterity: 6 }, costMul: 1.5 },
    ];

    const pickPrefix = Math.random() < 0.6 ? prefixes[Math.floor(Math.random() * prefixes.length)] : null;
    const pickSuffix = Math.random() < 0.6 ? suffixes[Math.floor(Math.random() * suffixes.length)] : null;

    if (!pickPrefix && !pickSuffix) {
      // Force at least one
      return this.applyMagicAffixes(item);
    }

    let fullName = item.name;
    let costMul = 1.0;
    const stats: any = { ...item.stats };

    if (pickPrefix) {
      fullName = `${pickPrefix.name} ${fullName}`;
      costMul *= pickPrefix.costMul;
      for (const [k, v] of Object.entries(pickPrefix.stats)) {
        stats[k] = (stats[k] || 0) + v;
      }
    }

    if (pickSuffix) {
      fullName = `${fullName} ${pickSuffix.name}`;
      costMul *= pickSuffix.costMul;
      for (const [k, v] of Object.entries(pickSuffix.stats)) {
        stats[k] = (stats[k] || 0) + v;
      }
    }

    return {
      ...item,
      id: this.generateId(),
      name: fullName,
      quality: ItemQuality.MAGIC,
      stats,
      goldValue: Math.floor(item.goldValue * costMul),
      identified: false, // Unidentified magic item!
      prefix: pickPrefix?.name,
      suffix: pickSuffix?.name
    };
  }
}
