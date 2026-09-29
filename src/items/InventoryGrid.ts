import { Item, ItemType } from './ItemTypes';
import { AffixGenerator } from './AffixGenerator';

export const INVENTORY_COLS = 10;
export const INVENTORY_ROWS = 4;
export const MAX_GOLD_STACK = 5000;

export interface PlacedItem {
  item: Item;
  col: number;
  row: number;
}

export class InventoryGrid {
  public readonly cols: number = INVENTORY_COLS;
  public readonly rows: number = INVENTORY_ROWS;

  // Grid storing item references
  private cells: (Item | null)[][];
  private items: Map<string, PlacedItem> = new Map();

  constructor() {
    this.cells = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );
  }

  public canPlace(item: Item, col: number, row: number, ignoreItem?: Item): boolean {
    if (col < 0 || row < 0) return false;
    if (col + item.width > this.cols || row + item.height > this.rows) {
      return false;
    }

    for (let r = row; r < row + item.height; r++) {
      for (let c = col; c < col + item.width; c++) {
        const occupying = this.cells[r][c];
        if (occupying !== null && occupying !== ignoreItem) {
          return false;
        }
      }
    }
    return true;
  }

  public placeItem(item: Item, col: number, row: number): boolean {
    if (!this.canPlace(item, col, row)) {
      return false;
    }

    // Occupy cells
    for (let r = row; r < row + item.height; r++) {
      for (let c = col; c < col + item.width; c++) {
        this.cells[r][c] = item;
      }
    }

    this.items.set(item.id, { item, col, row });
    return true;
  }

  public removeItem(itemId: string): Item | null {
    const placed = this.items.get(itemId);
    if (!placed) return null;

    const { item, col, row } = placed;
    for (let r = row; r < row + item.height; r++) {
      for (let c = col; c < col + item.width; c++) {
        if (this.cells[r][c] === item) {
          this.cells[r][c] = null;
        }
      }
    }

    this.items.delete(itemId);
    return item;
  }

  public getItemAt(col: number, row: number): Item | null {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return null;
    }
    return this.cells[row][col];
  }

  public getPlacedItem(itemId: string): PlacedItem | undefined {
    return this.items.get(itemId);
  }

  public getAllItems(): PlacedItem[] {
    return Array.from(this.items.values());
  }

  public autoPlace(item: Item): boolean {
    // If it's gold, attempt stack merge first
    if (item.type === ItemType.GOLD) {
      if (this.mergeGold(item)) {
        return true;
      }
    }

    // Search for first available slot (top-to-bottom, left-to-right)
    for (let r = 0; r <= this.rows - item.height; r++) {
      for (let c = 0; c <= this.cols - item.width; c++) {
        if (this.canPlace(item, c, r)) {
          return this.placeItem(item, c, r);
        }
      }
    }
    return false;
  }

  public mergeGold(goldItem: Item): boolean {
    const amount = goldItem.quantity || goldItem.goldValue;
    let remaining = amount;

    for (const placed of this.items.values()) {
      if (placed.item.type === ItemType.GOLD) {
        const curStack = placed.item.quantity || placed.item.goldValue;
        if (curStack < MAX_GOLD_STACK) {
          const space = MAX_GOLD_STACK - curStack;
          const toAdd = Math.min(space, remaining);
          const newTotal = curStack + toAdd;
          placed.item.quantity = newTotal;
          placed.item.goldValue = newTotal;
          placed.item.name = `${newTotal} Gold`;
          remaining -= toAdd;
          if (remaining <= 0) {
            return true;
          }
        }
      }
    }

    if (remaining > 0) {
      const leftoverGold = AffixGenerator.createGoldPile(remaining);
      // Place leftover in a new slot
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.canPlace(leftoverGold, c, r)) {
            return this.placeItem(leftoverGold, c, r);
          }
        }
      }
    }

    return remaining === 0;
  }

  public getTotalGold(): number {
    let total = 0;
    for (const placed of this.items.values()) {
      if (placed.item.type === ItemType.GOLD) {
        total += placed.item.quantity || placed.item.goldValue;
      }
    }
    return total;
  }

  public spendGold(amount: number): boolean {
    if (this.getTotalGold() < amount) return false;

    let needed = amount;
    const goldPiles = Array.from(this.items.values()).filter(p => p.item.type === ItemType.GOLD);

    for (const placed of goldPiles) {
      const cur = placed.item.quantity || placed.item.goldValue;
      if (cur <= needed) {
        needed -= cur;
        this.removeItem(placed.item.id);
      } else {
        const remaining = cur - needed;
        placed.item.quantity = remaining;
        placed.item.goldValue = remaining;
        placed.item.name = `${remaining} Gold`;
        needed = 0;
        break;
      }
      if (needed <= 0) break;
    }
    return true;
  }
}
