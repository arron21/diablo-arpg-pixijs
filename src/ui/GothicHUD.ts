import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';
import { AssetFactory } from '../graphics/AssetFactory';

export class GothicHUD {
  public readonly container: Container;

  private healthFluid: Sprite;
  private manaFluid: Sprite;
  private healthMask: Graphics;
  private manaMask: Graphics;

  private hpText: Text;
  private manaText: Text;
  private xpBar: Graphics;
  private levelText: Text;
  private levelUpButton: Container;

  private beltSprites: (Sprite | null)[] = [null, null, null, null];
  private beltSlotContainers: Container[] = [];

  private onToggleInventory?: () => void;
  private onToggleCharacter?: () => void;
  private onToggleAutomap?: () => void;

  constructor(
    viewportWidth: number,
    viewportHeight: number,
    onToggleInventory?: () => void,
    onToggleCharacter?: () => void,
    onToggleAutomap?: () => void
  ) {
    this.container = new Container();
    this.onToggleInventory = onToggleInventory;
    this.onToggleCharacter = onToggleCharacter;
    this.onToggleAutomap = onToggleAutomap;

    const hudHeight = 90;
    const hudY = viewportHeight - hudHeight;

    // 1. Bottom Dark Gothic Bar Background
    const barBg = new Graphics();
    barBg.rect(0, hudY, viewportWidth, hudHeight);
    barBg.fill({ color: 0x0a090d, alpha: 0.95 });
    barBg.stroke({ color: 0x3d3527, width: 2 }); // antique bronze trim
    this.container.addChild(barBg);

    // 2. HEALTH GLOBE (Left)
    const globeHealthX = 50;
    const globeY = hudY + 45;

    const healthBg = new Sprite(AssetFactory.getTexture('ui_globe_health_empty'));
    healthBg.anchor.set(0.5);
    healthBg.x = globeHealthX;
    healthBg.y = globeY;
    this.container.addChild(healthBg);

    this.healthFluid = new Sprite(AssetFactory.getTexture('ui_globe_health_fluid'));
    this.healthFluid.anchor.set(0.5);
    this.healthFluid.x = globeHealthX;
    this.healthFluid.y = globeY;

    this.healthMask = new Graphics();
    this.healthFluid.mask = this.healthMask;
    this.container.addChild(this.healthMask);
    this.container.addChild(this.healthFluid);

    const hpStyle = new TextStyle({
      fontFamily: 'serif',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 2 }
    });
    this.hpText = new Text({ text: '80/80', style: hpStyle });
    this.hpText.anchor.set(0.5);
    this.hpText.x = globeHealthX;
    this.hpText.y = globeY;
    this.container.addChild(this.hpText);

    // 3. MANA GLOBE (Right)
    const globeManaX = viewportWidth - 50;

    const manaBg = new Sprite(AssetFactory.getTexture('ui_globe_health_empty'));
    manaBg.anchor.set(0.5);
    manaBg.x = globeManaX;
    manaBg.y = globeY;
    this.container.addChild(manaBg);

    this.manaFluid = new Sprite(AssetFactory.getTexture('ui_globe_mana_fluid'));
    this.manaFluid.anchor.set(0.5);
    this.manaFluid.x = globeManaX;
    this.manaFluid.y = globeY;

    this.manaMask = new Graphics();
    this.manaFluid.mask = this.manaMask;
    this.container.addChild(this.manaMask);
    this.container.addChild(this.manaFluid);

    this.manaText = new Text({ text: '25/25', style: hpStyle });
    this.manaText.anchor.set(0.5);
    this.manaText.x = globeManaX;
    this.manaText.y = globeY;
    this.container.addChild(this.manaText);

    // 4. CENTER BELT & XP
    const centerX = viewportWidth / 2;

    // XP Bar
    this.xpBar = new Graphics();
    this.container.addChild(this.xpBar);

    // Belt Hotbar Slots (1, 2, 3, 4)
    const slotSize = 34;
    const beltStartX = centerX - (4 * (slotSize + 6)) / 2;
    const beltY = hudY + 12;

    for (let i = 0; i < 4; i++) {
      const slotBox = new Container();
      slotBox.x = beltStartX + i * (slotSize + 6);
      slotBox.y = beltY;

      const bg = new Graphics();
      bg.rect(0, 0, slotSize, slotSize);
      bg.fill({ color: 0x18151f });
      bg.stroke({ color: 0x4a4336, width: 1.5 });
      slotBox.addChild(bg);

      // Key label (1..4)
      const numLabel = new Text({
        text: `${i + 1}`,
        style: new TextStyle({ fontFamily: 'serif', fontSize: 10, fill: 0x8a8070 })
      });
      numLabel.x = 3;
      numLabel.y = 2;
      slotBox.addChild(numLabel);

      this.beltSlotContainers.push(slotBox);
      this.container.addChild(slotBox);
    }

    // 5. ACTION BUTTONS (Inventory, Character, Automap)
    const btnStyle = new TextStyle({
      fontFamily: 'serif',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0xd4af37,
      stroke: { color: 0x000000, width: 2 }
    });

    const createButton = (label: string, x: number, y: number, onClick?: () => void) => {
      const btn = new Container();
      btn.x = x;
      btn.y = y;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const bg = new Graphics();
      bg.rect(0, 0, 78, 24);
      bg.fill({ color: 0x221d2b });
      bg.stroke({ color: 0x615438, width: 1.5 });
      btn.addChild(bg);

      const txt = new Text({ text: label, style: btnStyle });
      txt.anchor.set(0.5);
      txt.x = 39;
      txt.y = 12;
      btn.addChild(txt);

      if (onClick) {
        btn.on('pointerdown', (e) => {
          e.stopPropagation();
          onClick();
        });
      }
      return btn;
    };

    const btnY = hudY + 54;
    this.container.addChild(createButton('[C] Char', centerX - 125, btnY, this.onToggleCharacter));
    this.container.addChild(createButton('[I] Bag', centerX - 39, btnY, this.onToggleInventory));
    this.container.addChild(createButton('[Tab] Map', centerX + 47, btnY, this.onToggleAutomap));

    // Level & Level-Up Indicator
    this.levelText = new Text({
      text: 'Level 1',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 12, fill: 0xa69777 })
    });
    this.levelText.x = globeHealthX + 48;
    this.levelText.y = hudY + 16;
    this.container.addChild(this.levelText);

    // Golden Level-Up "+" button
    this.levelUpButton = new Container();
    this.levelUpButton.x = globeHealthX + 48;
    this.levelUpButton.y = hudY + 38;
    this.levelUpButton.eventMode = 'static';
    this.levelUpButton.cursor = 'pointer';

    const plusBg = new Graphics();
    plusBg.circle(10, 10, 10);
    plusBg.fill({ color: 0xb5891b });
    plusBg.stroke({ color: 0xffec80, width: 1.5 });
    this.levelUpButton.addChild(plusBg);

    const plusTxt = new Text({
      text: '+',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 14, fontWeight: 'bold', fill: 0x000000 })
    });
    plusTxt.anchor.set(0.5);
    plusTxt.x = 10;
    plusTxt.y = 10;
    this.levelUpButton.addChild(plusTxt);
    this.levelUpButton.visible = false;

    if (this.onToggleCharacter) {
      this.levelUpButton.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onToggleCharacter?.();
      });
    }
    this.container.addChild(this.levelUpButton);
  }

  public update(player: Player, viewportWidth: number, viewportHeight: number): void {
    const hudY = viewportHeight - 90;
    const centerX = viewportWidth / 2;

    // 1. Health Globe fluid level
    const hpRatio = Math.max(0, Math.min(1, player.stats.currentHp / player.stats.maxHp));
    const globeHealthX = 50;
    const globeY = hudY + 45;
    const fluidRadius = 34;

    this.healthMask.clear();
    const hpHeight = fluidRadius * 2 * hpRatio;
    this.healthMask.rect(
      globeHealthX - fluidRadius,
      globeY + fluidRadius - hpHeight,
      fluidRadius * 2,
      hpHeight
    );
    this.healthMask.fill({ color: 0xffffff });
    this.hpText.text = `${player.stats.currentHp}/${player.stats.maxHp}`;

    // 2. Mana Globe fluid level
    const manaRatio = Math.max(0, Math.min(1, player.stats.currentMana / player.stats.maxMana));
    const globeManaX = viewportWidth - 50;

    this.manaMask.clear();
    const manaHeight = fluidRadius * 2 * manaRatio;
    this.manaMask.rect(
      globeManaX - fluidRadius,
      globeY + fluidRadius - manaHeight,
      fluidRadius * 2,
      manaHeight
    );
    this.manaMask.fill({ color: 0xffffff });
    this.manaText.text = `${player.stats.currentMana}/${player.stats.maxMana}`;

    // 3. Level & XP bar
    this.levelText.text = `Level ${player.stats.level}`;
    this.levelUpButton.visible = player.unspentStatPoints > 0;

    const xpRatio = Math.max(0, Math.min(1, player.currentXp / player.nextLevelXp));
    this.xpBar.clear();
    const xpBarW = 200;
    const xpBarH = 4;
    const xpBarX = centerX - xpBarW / 2;
    const xpBarY = hudY + 4;

    this.xpBar.rect(xpBarX, xpBarY, xpBarW, xpBarH);
    this.xpBar.fill({ color: 0x1f1910 });
    this.xpBar.stroke({ color: 0x473d2b, width: 1 });

    if (xpRatio > 0) {
      this.xpBar.rect(xpBarX + 1, xpBarY + 1, (xpBarW - 2) * xpRatio, xpBarH - 2);
      this.xpBar.fill({ color: 0xd4af37 });
    }

    // 4. Belt items
    for (let i = 0; i < 4; i++) {
      const item = player.belt.getSlot(i);
      const slotContainer = this.beltSlotContainers[i];
      let spr = this.beltSprites[i];

      if (item) {
        if (!spr) {
          spr = new Sprite();
          spr.anchor.set(0.5);
          spr.x = 17;
          spr.y = 17;
          slotContainer.addChild(spr);
          this.beltSprites[i] = spr;
        }
        spr.texture = AssetFactory.getTexture(item.textureKey);
        spr.visible = true;
      } else if (spr) {
        spr.visible = false;
      }
    }
  }
}
