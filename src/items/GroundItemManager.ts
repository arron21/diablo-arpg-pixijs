import { Container, Sprite, Text, TextStyle } from 'pixi.js';
import { Item } from './ItemTypes';
import { AssetFactory } from '../graphics/AssetFactory';
import { gridToScreen, calculateDepth } from '../engine/IsoMath';

export interface GroundItem {
  item: Item;
  gx: number;
  gy: number;
  container: Container;
  sprite: Sprite;
  nameLabel: Text;
  canPickupAfter?: number;
}

export class GroundItemManager {
  private container: Container;
  private items: GroundItem[] = [];

  constructor(container: Container) {
    this.container = container;
  }

  public dropItem(item: Item, gx: number, gy: number, pickupCooldownMs: number = 0): GroundItem {
    const itemContainer = new Container();
    const screenPos = gridToScreen(gx, gy);

    // Sprite
    const sprite = new Sprite(AssetFactory.getTexture(item.textureKey));
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(0.75); // slightly smaller on ground
    itemContainer.addChild(sprite);

    // Name label on hover or alt
    const style = new TextStyle({
      fontFamily: 'serif',
      fontSize: 11,
      fill: item.quality === 'unique' ? 0xd4af37 : (item.quality === 'magic' ? 0x59a2ff : 0xcccccc),
      stroke: { color: 0x000000, width: 2 }
    });
    const nameLabel = new Text({ text: item.name, style });
    nameLabel.anchor.set(0.5, 1);
    nameLabel.y = -12;
    itemContainer.addChild(nameLabel);

    itemContainer.x = screenPos.x + 32;
    itemContainer.y = screenPos.y + 16;
    itemContainer.zIndex = calculateDepth(gx, gy, 12);

    this.container.addChild(itemContainer);

    const groundItem: GroundItem = {
      item,
      gx,
      gy,
      container: itemContainer,
      sprite,
      nameLabel,
      canPickupAfter: pickupCooldownMs > 0 ? Date.now() + pickupCooldownMs : 0
    };

    this.items.push(groundItem);
    return groundItem;
  }

  public getItemsNear(gx: number, gy: number, radius: number = 1.2, ignoreCooldown: boolean = false): GroundItem[] {
    const now = Date.now();
    return this.items.filter(groundItem => {
      if (!ignoreCooldown && groundItem.canPickupAfter && groundItem.canPickupAfter > now) {
        return false;
      }
      const dist = Math.hypot(groundItem.gx - gx, groundItem.gy - gy);
      return dist <= radius;
    });
  }

  public getAllItems(): GroundItem[] {
    return this.items;
  }

  public removeItem(groundItem: GroundItem): void {
    const idx = this.items.indexOf(groundItem);
    if (idx !== -1) {
      this.container.removeChild(groundItem.container);
      groundItem.container.destroy({ children: true });
      this.items.splice(idx, 1);
    }
  }

  public updateVisibility(isVisibleFn: (gx: number, gy: number) => boolean): void {
    for (const item of this.items) {
      item.container.visible = isVisibleFn(item.gx, item.gy);
    }
  }
}
