export enum ItemType {
  WEAPON = 'weapon',
  SHIELD = 'shield',
  HELM = 'helm',
  ARMOR = 'armor',
  POTION = 'potion',
  SCROLL = 'scroll',
  RING = 'ring',
  AMULET = 'amulet',
  GOLD = 'gold'
}

export enum ItemQuality {
  NORMAL = 'normal',
  MAGIC = 'magic',
  UNIQUE = 'unique'
}

export interface ItemStats {
  minDamage?: number;
  maxDamage?: number;
  armorClass?: number;
  toHit?: number;
  strength?: number;
  dexterity?: number;
  magic?: number;
  vitality?: number;
  maxHp?: number;
  maxMana?: number;
  lightRadius?: number;
  baseBlockChance?: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  quality: ItemQuality;
  width: number;  // 1 or 2
  height: number; // 1, 2, or 3
  textureKey: string;
  stats: ItemStats;
  goldValue: number;
  quantity?: number; // for gold or stacked items
  identified: boolean;
  prefix?: string;
  suffix?: string;
}
