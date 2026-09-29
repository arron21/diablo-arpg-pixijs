import { Item, ItemType } from './ItemTypes';

export class Belt {
  public readonly slots: (Item | null)[] = [null, null, null, null];

  public canHold(item: Item): boolean {
    return item.type === ItemType.POTION || item.type === ItemType.SCROLL;
  }

  public setSlot(index: number, item: Item): boolean {
    if (index < 0 || index >= 4 || !this.canHold(item)) {
      return false;
    }
    this.slots[index] = item;
    return true;
  }

  public getSlot(index: number): Item | null {
    if (index < 0 || index >= 4) return null;
    return this.slots[index];
  }

  public useSlot(index: number): Item | null {
    if (index < 0 || index >= 4) return null;
    const item = this.slots[index];
    this.slots[index] = null;
    return item;
  }

  public autoAdd(item: Item): boolean {
    if (!this.canHold(item)) return false;
    for (let i = 0; i < 4; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = item;
        return true;
      }
    }
    return false;
  }
}
