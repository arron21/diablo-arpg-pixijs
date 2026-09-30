import { Container, Graphics, Rectangle, Sprite, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';
import { Item, ItemType } from '../items/ItemTypes';
import { EquipmentSlot } from '../items/EquipmentDoll';
import { AssetFactory } from '../graphics/AssetFactory';

export class InventoryView {
  public readonly container: Container;
  public isVisible: boolean = false;
  public onDropItem?: (item: Item) => void;
  public onUseScroll?: (item: Item) => boolean;

  private player: Player;
  private onSound?: (key: string) => void;

  // Selected / picked up item on cursor
  public heldItem: Item | null = null;
  private heldItemSprite: Sprite;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // UI elements
  private gridContainer: Container;
  private paperdollContainer: Container;
  private goldText: Text;
  private tooltipContainer: Container;
  private tooltipBg: Graphics;
  private tooltipText: Text;

  private readonly CELL_SIZE = 28;

  constructor(player: Player, onSound?: (key: string) => void) {
    this.player = player;
    this.onSound = onSound;
    this.container = new Container();
    this.container.visible = false;
    this.container.eventMode = 'static'; // catch mouse events so clicking bag doesn't move player

    // 1. Gothic Panel Background
    const panelW = 340;
    const panelH = 460;

    const bg = new Graphics();
    bg.rect(0, 0, panelW, panelH);
    bg.fill({ color: 0x121017, alpha: 0.96 });
    bg.stroke({ color: 0x544833, width: 2.5 });
    this.container.addChild(bg);

    // Title Bar
    const titleStyle = new TextStyle({
      fontFamily: 'serif',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xd4af37,
      stroke: { color: 0x000000, width: 2 }
    });
    const title = new Text({ text: 'INVENTORY & EQUIPMENT', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.x = panelW / 2;
    title.y = 8;
    this.container.addChild(title);

    // Close button
    const closeBtn = new Container();
    closeBtn.x = panelW - 24;
    closeBtn.y = 6;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    const closeBg = new Graphics();
    closeBg.rect(0, 0, 18, 18);
    closeBg.fill({ color: 0x3d1717 });
    closeBg.stroke({ color: 0x782d2d, width: 1 });
    closeBtn.addChild(closeBg);
    const closeTxt = new Text({ text: 'X', style: new TextStyle({ fontFamily: 'serif', fontSize: 11, fill: 0xffffff }) });
    closeTxt.anchor.set(0.5);
    closeTxt.x = 9;
    closeTxt.y = 9;
    closeBtn.addChild(closeTxt);
    closeBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
    });
    this.container.addChild(closeBtn);

    // 2. Paperdoll equipment container
    this.paperdollContainer = new Container();
    this.paperdollContainer.x = 15;
    this.paperdollContainer.y = 35;
    this.container.addChild(this.paperdollContainer);

    // 3. Grid container
    this.gridContainer = new Container();
    this.gridContainer.x = 30;
    this.gridContainer.y = 265;
    this.container.addChild(this.gridContainer);

    // 4. Gold display
    this.goldText = new Text({
      text: 'Gold: 0',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 12, fill: 0xffdf66 })
    });
    this.goldText.x = 30;
    this.goldText.y = 390;
    this.container.addChild(this.goldText);

    // 5. Tooltip (eventMode = 'none' to never intercept mouse events or cause hover bugs)
    this.tooltipContainer = new Container();
    this.tooltipContainer.visible = false;
    this.tooltipContainer.eventMode = 'none';
    this.tooltipContainer.interactiveChildren = false;

    this.tooltipBg = new Graphics();
    this.tooltipContainer.addChild(this.tooltipBg);

    this.tooltipText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'serif',
        fontSize: 11,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 155,
        lineHeight: 16
      })
    });
    this.tooltipText.x = 8;
    this.tooltipText.y = 8;
    this.tooltipContainer.addChild(this.tooltipText);
    this.container.addChild(this.tooltipContainer);

    // 6. Held item sprite on cursor (eventMode = 'none' so it never blocks clicks underneath!)
    this.heldItemSprite = new Sprite();
    this.heldItemSprite.visible = false;
    this.heldItemSprite.eventMode = 'none';
    this.heldItemSprite.interactiveChildren = false;
    this.container.addChild(this.heldItemSprite);

    this.buildPaperdoll();
    this.buildGrid();
  }

  public open(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.container.visible = true;
      this.refresh();
      this.onSound?.('item_equip');
    }
  }

  public close(): void {
    if (this.isVisible) {
      this.returnHeldItem();
      this.isVisible = false;
      this.container.visible = false;
      this.hideTooltip();
    }
  }

  public toggle(): boolean {
    if (this.isVisible) {
      this.close();
      return false;
    } else {
      this.open();
      return true;
    }
  }

  public returnHeldItem(): void {
    if (!this.heldItem) return;
    const item = this.heldItem;
    this.heldItem = null;
    this.heldItemSprite.visible = false;

    // Try returning to player's inventory
    if (!this.player.inventory.autoPlace(item)) {
      // If inventory is completely full, drop at feet
      this.onDropItem?.(item);
    }
    this.refresh();
  }

  private buildPaperdoll(): void {
    const dollSlots: { slot: EquipmentSlot; x: number; y: number; w: number; h: number; label: string }[] = [
      { slot: 'HEAD', x: 125, y: 10, w: 2, h: 2, label: 'Head' },
      { slot: 'MAIN_HAND', x: 25, y: 50, w: 2, h: 3, label: 'Main' },
      { slot: 'TORSO', x: 125, y: 75, w: 2, h: 3, label: 'Torso' },
      { slot: 'OFF_HAND', x: 225, y: 50, w: 2, h: 2, label: 'Off' },
      { slot: 'AMULET', x: 200, y: 15, w: 1, h: 1, label: 'Neck' },
      { slot: 'RING_LEFT', x: 40, y: 145, w: 1, h: 1, label: 'Ring' },
      { slot: 'RING_RIGHT', x: 240, y: 145, w: 1, h: 1, label: 'Ring' },
    ];

    for (const s of dollSlots) {
      const slotBox = new Container();
      slotBox.x = s.x;
      slotBox.y = s.y;
      slotBox.eventMode = 'static';
      slotBox.cursor = 'pointer';

      const wPx = s.w * this.CELL_SIZE;
      const hPx = s.h * this.CELL_SIZE;
      slotBox.hitArea = new Rectangle(0, 0, wPx, hPx);

      const bg = new Graphics();
      bg.rect(0, 0, wPx, hPx);
      bg.fill({ color: 0x1f1b26 });
      bg.stroke({ color: 0x4a4336, width: 1 });
      bg.eventMode = 'none';
      slotBox.addChild(bg);

      const label = new Text({
        text: s.label,
        style: new TextStyle({ fontFamily: 'serif', fontSize: 9, fill: 0x5e5645 })
      });
      label.anchor.set(0.5);
      label.x = wPx / 2;
      label.y = hPx / 2;
      label.eventMode = 'none';
      slotBox.addChild(label);

      slotBox.on('pointerdown', (e) => {
        e.stopPropagation();
        this.handleSlotClick(s.slot, e.button);
      });

      slotBox.on('pointerover', () => {
        if (this.heldItem) return;
        const item = this.player.equipment.getItem(s.slot);
        if (item) this.showTooltip(item, 15 + s.x, 35 + s.y, s.w * this.CELL_SIZE, s.h * this.CELL_SIZE);
      });
      slotBox.on('pointerout', () => this.hideTooltip());

      (slotBox as any).slotName = s.slot;
      this.paperdollContainer.addChild(slotBox);
    }
  }

  private buildGrid(): void {
    // 10 cols x 4 rows
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = new Graphics();
        cell.rect(c * this.CELL_SIZE, r * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
        cell.fill({ color: 0x18151f });
        cell.stroke({ color: 0x332c23, width: 1 });
        cell.eventMode = 'static';
        cell.cursor = 'pointer';

        cell.on('pointerdown', (e) => {
          e.stopPropagation();
          this.handleGridClick(c, r, e.button);
        });

        cell.on('pointerover', () => {
          if (this.heldItem) return;
          const item = this.player.inventory.getItemAt(c, r);
          if (item) {
            const placed = this.player.inventory.getPlacedItem(item.id);
            const w = (item.width || 1) * this.CELL_SIZE;
            const h = (item.height || 1) * this.CELL_SIZE;
            const originCol = placed ? placed.col : c;
            const originRow = placed ? placed.row : r;
            this.showTooltip(item, 30 + originCol * this.CELL_SIZE, 265 + originRow * this.CELL_SIZE, w, h);
          }
        });
        cell.on('pointerout', () => this.hideTooltip());

        this.gridContainer.addChild(cell);
      }
    }
  }

  private handleGridClick(col: number, row: number, mouseButton: number = 0): void {
    this.hideTooltip();
    const existing = this.player.inventory.getItemAt(col, row);

    // Right-click quick action (consume potion or quick-equip)
    if (mouseButton === 2 && !this.heldItem && existing) {
      if (existing.type === ItemType.POTION) {
        if (existing.name.toLowerCase().includes('mana')) {
          this.player.restoreMana(35);
        } else {
          this.player.heal(50);
        }
        this.player.inventory.removeItem(existing.id);
        this.onSound?.('potion_gulp');
        this.refresh();
        return;
      }

      if (existing.type === ItemType.SCROLL) {
        if (this.onUseScroll && this.onUseScroll(existing)) {
          this.player.inventory.removeItem(existing.id);
          this.refresh();
          return;
        }
      }

      // Quick-equip to paperdoll
      let targetSlot: EquipmentSlot | null = null;
      if (existing.type === ItemType.HELM) targetSlot = 'HEAD';
      else if (existing.type === ItemType.ARMOR) targetSlot = 'TORSO';
      else if (existing.type === ItemType.WEAPON) targetSlot = 'MAIN_HAND';
      else if (existing.type === ItemType.SHIELD) targetSlot = 'OFF_HAND';
      else if (existing.type === ItemType.AMULET) targetSlot = 'AMULET';
      else if (existing.type === ItemType.RING) {
        targetSlot = this.player.equipment.getItem('RING_LEFT') ? 'RING_RIGHT' : 'RING_LEFT';
      }

      if (targetSlot && this.player.equipment.canEquip(targetSlot, existing)) {
        const placed = this.player.inventory.getPlacedItem(existing.id);
        const originCol = placed ? placed.col : col;
        const originRow = placed ? placed.row : row;
        this.player.inventory.removeItem(existing.id);
        const prevEquipped = this.player.equipment.equip(targetSlot, existing);
        if (prevEquipped) {
          if (!this.player.inventory.placeItem(prevEquipped, originCol, originRow)) {
            this.player.inventory.autoPlace(prevEquipped);
          }
        }
        this.player.recalculateStats();
        this.onSound?.('item_equip');
        this.refresh();
        return;
      }
    }

    if (this.heldItem) {
      let targetCol = col;
      let targetRow = row;
      let canDrop = this.player.inventory.canPlace(this.heldItem, targetCol, targetRow, existing || undefined);

      // Ergonomic swap: if clicked anywhere on a multi-cell item, test placing at that item's origin
      if (!canDrop && existing) {
        const placed = this.player.inventory.getPlacedItem(existing.id);
        if (placed && this.player.inventory.canPlace(this.heldItem, placed.col, placed.row, existing)) {
          targetCol = placed.col;
          targetRow = placed.row;
          canDrop = true;
        }
      }

      if (canDrop) {
        if (existing) {
          this.player.inventory.removeItem(existing.id);
        }
        this.player.inventory.placeItem(this.heldItem, targetCol, targetRow);
        this.heldItem = existing; // Swap or null
        this.onSound?.('item_equip');
      }
    } else if (existing) {
      // Pick up item onto cursor
      this.player.inventory.removeItem(existing.id);
      this.heldItem = existing;
      this.onSound?.('item_equip');
    }

    this.refresh();
  }

  private handleSlotClick(slot: EquipmentSlot, mouseButton: number = 0): void {
    this.hideTooltip();
    const current = this.player.equipment.getItem(slot);

    // Right-click quick unequip to bag
    if (mouseButton === 2 && !this.heldItem && current) {
      if (this.player.inventory.autoPlace(current)) {
        this.player.equipment.unequip(slot);
        this.player.recalculateStats();
        this.onSound?.('item_equip');
        this.refresh();
      }
      return;
    }

    if (this.heldItem) {
      if (this.player.equipment.canEquip(slot, this.heldItem)) {
        const prev = this.player.equipment.equip(slot, this.heldItem);
        this.heldItem = prev; // Place held item into slot; if previously occupied, swap it onto cursor
        this.player.recalculateStats();
        this.onSound?.('item_equip');
      }
    } else if (current) {
      // Pick up equipped item onto cursor
      this.player.equipment.unequip(slot);
      this.heldItem = current;
      this.player.recalculateStats();
      this.onSound?.('item_equip');
    }

    this.refresh();
  }

  public refresh(): void {
    this.goldText.text = `Gold: ${this.player.inventory.getTotalGold()}`;

    // Clear old item sprites from paperdoll
    for (const child of this.paperdollContainer.children) {
      const slotName = (child as any).slotName as EquipmentSlot;
      if (slotName) {
        while (child.children.length > 2) {
          child.removeChildAt(2);
        }
        const item = this.player.equipment.getItem(slotName);
        if (item) {
          const spr = new Sprite(AssetFactory.getTexture(item.textureKey));
          spr.x = 2;
          spr.y = 2;
          spr.eventMode = 'none';
          child.addChild(spr);
        }
      }
    }

    // Clear old item sprites from grid
    while (this.gridContainer.children.length > 40) {
      this.gridContainer.removeChildAt(40);
    }

    // Draw all items currently in grid
    for (const placed of this.player.inventory.getAllItems()) {
      const spr = new Sprite(AssetFactory.getTexture(placed.item.textureKey));
      spr.x = placed.col * this.CELL_SIZE;
      spr.y = placed.row * this.CELL_SIZE;
      spr.eventMode = 'none';
      this.gridContainer.addChild(spr);
    }

    // Update held item sprite
    if (this.heldItem) {
      this.heldItemSprite.texture = AssetFactory.getTexture(this.heldItem.textureKey);
      this.heldItemSprite.x = this.lastMouseX - this.container.x - 14;
      this.heldItemSprite.y = this.lastMouseY - this.container.y - 14;
      this.heldItemSprite.visible = true;
    } else {
      this.heldItemSprite.visible = false;
    }
  }

  public updateCursor(mouseX: number, mouseY: number): void {
    this.lastMouseX = mouseX;
    this.lastMouseY = mouseY;
    if (this.heldItem && this.heldItemSprite.visible) {
      this.heldItemSprite.x = mouseX - this.container.x - 14;
      this.heldItemSprite.y = mouseY - this.container.y - 14;
    }
  }

  private showTooltip(
    item: Item,
    itemX: number,
    itemY: number,
    itemW: number = this.CELL_SIZE,
    itemH: number = this.CELL_SIZE
  ): void {
    if (this.heldItem) {
      this.hideTooltip();
      return;
    }
    let text = `${item.name}\n`;
    if (item.type === ItemType.WEAPON) {
      text += `Damage: ${item.stats.minDamage}-${item.stats.maxDamage}\n`;
    }
    if (item.stats.armorClass) {
      text += `Armor: ${item.stats.armorClass}\n`;
    }
    if (item.stats.toHit) {
      text += `+${item.stats.toHit}% To-Hit\n`;
    }
    if (item.stats.strength) {
      text += `+${item.stats.strength} Strength\n`;
    }
    if (item.stats.dexterity) {
      text += `+${item.stats.dexterity} Dexterity\n`;
    }
    if (item.stats.vitality) {
      text += `+${item.stats.vitality} Vitality\n`;
    }
    if (item.stats.maxHp) {
      text += `+${item.stats.maxHp} Life\n`;
    }
    if (item.stats.maxMana) {
      text += `+${item.stats.maxMana} Mana\n`;
    }
    if (item.stats.lightRadius) {
      text += `+${item.stats.lightRadius} Light Radius\n`;
    }
    if (item.stats.baseBlockChance) {
      text += `Block: ${item.stats.baseBlockChance}%\n`;
    }
    text += `Value: ${item.goldValue} Gold`;

    // Quality color styling
    let qualityBorder = 0x6e5f44;
    let titleColor = 0xffffff;
    if (item.quality === 'magic') {
      qualityBorder = 0x388bfd;
      titleColor = 0x82b4ff;
    } else if (item.quality === 'unique') {
      qualityBorder = 0xd4af37;
      titleColor = 0xffdf66;
    }

    this.tooltipText.style.fill = titleColor;
    this.tooltipText.text = text;

    // Dynamically size background box to fit content with padding
    const ttW = Math.max(145, Math.ceil(this.tooltipText.width + 16));
    const ttH = Math.ceil(this.tooltipText.height + 16);

    this.tooltipBg.clear();
    this.tooltipBg.rect(0, 0, ttW, ttH);
    this.tooltipBg.fill({ color: 0x07060a, alpha: 0.96 });
    this.tooltipBg.stroke({ color: qualityBorder, width: 1.5 });

    // Position tooltip next to the item (never overlapping it)
    const panelW = 340;
    const panelH = 460;

    // Try placing directly to the right of the item
    let targetX = itemX + itemW + 10;
    let targetY = itemY;

    // If extending past the right edge of panel, place to the left of the item
    if (targetX + ttW > panelW - 8) {
      targetX = itemX - ttW - 10;
    }

    // If placing to the left also extends past the left edge, place above or below
    if (targetX < 8) {
      targetX = Math.max(8, Math.min(panelW - ttW - 8, itemX + (itemW - ttW) / 2));
      if (itemY - ttH - 10 >= 30) {
        targetY = itemY - ttH - 10; // above item
      } else {
        targetY = itemY + itemH + 10; // below item
      }
    }

    // Clamp vertically inside panel
    targetY = Math.max(10, Math.min(panelH - ttH - 10, targetY));

    this.tooltipContainer.x = targetX;
    this.tooltipContainer.y = targetY;
    this.tooltipContainer.visible = true;
  }

  private hideTooltip(): void {
    this.tooltipContainer.visible = false;
  }
}
