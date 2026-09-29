import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';
import { AffixGenerator } from '../items/AffixGenerator';

export class TristramHub {
  public readonly container: Container;
  public isVisible: boolean = false;

  private player: Player;
  private onReturnToDungeon?: () => void;
  private onSound?: (key: string) => void;

  private messageText: Text;
  private goldText: Text;

  constructor(player: Player, onReturnToDungeon?: () => void, onSound?: (key: string) => void) {
    this.player = player;
    this.onReturnToDungeon = onReturnToDungeon;
    this.onSound = onSound;

    this.container = new Container();
    this.container.visible = false;
    this.container.eventMode = 'static';

    const panelW = 480;
    const panelH = 400;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, panelW, panelH);
    bg.fill({ color: 0x0f0e14, alpha: 0.98 });
    bg.stroke({ color: 0x665538, width: 3 });
    this.container.addChild(bg);

    // Title
    const title = new Text({
      text: 'TOWN OF TRISTRAM',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 18, fontWeight: 'bold', fill: 0xd4af37 })
    });
    title.anchor.set(0.5, 0);
    title.x = panelW / 2;
    title.y = 12;
    this.container.addChild(title);

    // Subtitle
    const subtitle = new Text({
      text: 'A desolate haven amidst the encroaching shadows.',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 11, fontStyle: 'italic', fill: 0x8f8676 })
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = panelW / 2;
    subtitle.y = 36;
    this.container.addChild(subtitle);

    // Gold counter
    this.goldText = new Text({
      text: 'Gold: 0',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 13, fill: 0xffe680 })
    });
    this.goldText.x = 24;
    this.goldText.y = 65;
    this.container.addChild(this.goldText);

    // NPC Dialog message box
    this.messageText = new Text({
      text: 'Deckard Cain: "Stay a while, and listen! What knowledge do you seek?"',
      style: new TextStyle({
        fontFamily: 'serif',
        fontSize: 12,
        fill: 0xdecba4,
        wordWrap: true,
        wordWrapWidth: panelW - 48,
        lineHeight: 18
      })
    });
    this.messageText.x = 24;
    this.messageText.y = 95;
    this.container.addChild(this.messageText);

    // NPC Action Buttons
    const btnStartX = 24;
    let btnY = 160;

    const createActionBtn = (label: string, onClick: () => void) => {
      const btn = new Container();
      btn.x = btnStartX;
      btn.y = btnY;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const bBg = new Graphics();
      bBg.rect(0, 0, panelW - 48, 28);
      bBg.fill({ color: 0x1c1824 });
      bBg.stroke({ color: 0x4d422e, width: 1.5 });
      btn.addChild(bBg);

      const bTxt = new Text({
        text: label,
        style: new TextStyle({ fontFamily: 'serif', fontSize: 11, fill: 0xd4af37 })
      });
      bTxt.anchor.set(0, 0.5);
      bTxt.x = 12;
      bTxt.y = 14;
      btn.addChild(bTxt);

      btn.on('pointerdown', (e) => {
        e.stopPropagation();
        onClick();
      });

      btnY += 36;
      this.container.addChild(btn);
    };

    // 1. Cain Identify
    createActionBtn('Cain: Identify All Magic Items (100 Gold)', () => {
      if (this.player.inventory.spendGold(100)) {
        let identifiedCount = 0;
        for (const placed of this.player.inventory.getAllItems()) {
          if (!placed.item.identified) {
            placed.item.identified = true;
            identifiedCount++;
          }
        }
        this.messageText.text = identifiedCount > 0
          ? `Cain: "I have revealed the ancient enchantments on ${identifiedCount} item(s)!"`
          : 'Cain: "You carry no unidentified magical artifacts, friend."';
        this.onSound?.('level_up');
        this.updateGoldDisplay();
      } else {
        this.messageText.text = 'Cain: "You lack the gold to pay for my ancient wisdom, traveler."';
      }
    });

    // 2. Pepin Healer
    createActionBtn('Pepin the Healer: Restore Full Health & Mana (Free)', () => {
      this.player.stats.currentHp = this.player.stats.maxHp;
      this.player.stats.currentMana = this.player.stats.maxMana;
      this.messageText.text = 'Pepin: "May the Light restore your wounds. Go forth with renewed vigor!"';
      this.onSound?.('potion_gulp');
    });

    // 3. Griswold Buy Potion
    createActionBtn('Griswold: Buy Healing Potion (50 Gold)', () => {
      if (this.player.inventory.spendGold(50)) {
        const pot = AffixGenerator.createHealthPotion();
        if (this.player.belt.autoAdd(pot) || this.player.inventory.autoPlace(pot)) {
          this.messageText.text = 'Griswold: "A fresh brew. Keep it handy against the devils below."';
          this.onSound?.('gold_pickup');
          this.updateGoldDisplay();
        } else {
          this.player.inventory.autoPlace(AffixGenerator.createGoldPile(50)); // refund
          this.messageText.text = 'Griswold: "Your pack is completely full!"';
        }
      } else {
        this.messageText.text = 'Griswold: "No gold, no goods. Come back when you have coin."';
      }
    });

    // 4. Griswold Buy Portal Scroll
    createActionBtn('Griswold: Buy Town Portal Scroll (100 Gold)', () => {
      if (this.player.inventory.spendGold(100)) {
        const scroll = AffixGenerator.createTownPortalScroll();
        if (this.player.belt.autoAdd(scroll) || this.player.inventory.autoPlace(scroll)) {
          this.messageText.text = 'Griswold: "Safe travels. May it bring you back in one piece."';
          this.onSound?.('gold_pickup');
          this.updateGoldDisplay();
        } else {
          this.player.inventory.autoPlace(AffixGenerator.createGoldPile(100));
          this.messageText.text = 'Griswold: "Your pack is completely full!"';
        }
      } else {
        this.messageText.text = 'Griswold: "You need 100 gold for a portal scroll."';
      }
    });

    // 5. Return to Dungeon Portal button
    btnY += 6;
    const returnBtn = new Container();
    returnBtn.x = btnStartX;
    returnBtn.y = btnY;
    returnBtn.eventMode = 'static';
    returnBtn.cursor = 'pointer';

    const rBg = new Graphics();
    rBg.rect(0, 0, panelW - 48, 34);
    rBg.fill({ color: 0x122e54 });
    rBg.stroke({ color: 0x3d82d4, width: 2 });
    returnBtn.addChild(rBg);

    const rTxt = new Text({
      text: '<< STEP THROUGH TOWN PORTAL (RETURN TO DUNGEON) >>',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 12, fontWeight: 'bold', fill: 0x8ac4ff })
    });
    rTxt.anchor.set(0.5);
    rTxt.x = (panelW - 48) / 2;
    rTxt.y = 17;
    returnBtn.addChild(rTxt);

    returnBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
      this.onSound?.('portal_open');
      this.onReturnToDungeon?.();
    });

    this.container.addChild(returnBtn);
  }

  public open(): void {
    this.isVisible = true;
    this.container.visible = true;
    this.updateGoldDisplay();
    this.messageText.text = 'Deckard Cain: "Stay a while, and listen! The Cathedral groans with terror."';
  }

  public close(): void {
    this.isVisible = false;
    this.container.visible = false;
  }

  public updateGoldDisplay(): void {
    this.goldText.text = `Gold: ${this.player.inventory.getTotalGold()}`;
  }
}
