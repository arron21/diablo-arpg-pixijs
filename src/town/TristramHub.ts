import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';
import { AffixGenerator } from '../items/AffixGenerator';

export type NPCId = 'cain' | 'griswold' | 'pepin';

export class TristramHub {
  public readonly container: Container;
  public isVisible: boolean = false;

  private player: Player;
  private onReturnToDungeon?: () => void;
  private onEnterCathedral?: () => void;
  private onSound?: (key: string) => void;
  public hasActivePortal: boolean = false;

  private activeNpc: NPCId = 'cain';

  private titleText: Text;
  private subtitleText: Text;
  private goldText: Text;
  private messageText: Text;
  private actionsContainer: Container;
  private returnBtn: Container;
  private returnBtnText: Text;
  private tabButtons: Map<NPCId, Container> = new Map();

  constructor(
    player: Player,
    onReturnToDungeon?: () => void,
    onEnterCathedral?: () => void,
    onSound?: (key: string) => void
  ) {
    this.player = player;
    this.onReturnToDungeon = onReturnToDungeon;
    this.onEnterCathedral = onEnterCathedral;
    this.onSound = onSound;

    this.container = new Container();
    this.container.visible = false;
    this.container.eventMode = 'static';

    const panelW = 520;
    const panelH = 430;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, panelW, panelH);
    bg.fill({ color: 0x0f0e14, alpha: 0.98 });
    bg.stroke({ color: 0x665538, width: 3 });
    this.container.addChild(bg);

    // Inner border
    const innerBorder = new Graphics();
    innerBorder.rect(8, 8, panelW - 16, panelH - 16);
    innerBorder.stroke({ color: 0x3d3527, width: 1 });
    this.container.addChild(innerBorder);

    // Close Button [X]
    const closeBtn = new Container();
    closeBtn.x = panelW - 36;
    closeBtn.y = 12;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';

    const closeBg = new Graphics();
    closeBg.rect(0, 0, 24, 24);
    closeBg.fill({ color: 0x241d24 });
    closeBg.stroke({ color: 0x8a7042, width: 1.5 });
    closeBtn.addChild(closeBg);

    const closeTxt = new Text({
      text: 'X',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 13, fontWeight: 'bold', fill: 0xd4af37 })
    });
    closeTxt.anchor.set(0.5);
    closeTxt.x = 12;
    closeTxt.y = 12;
    closeBtn.addChild(closeTxt);

    closeBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
      this.onSound?.('item_equip');
    });
    this.container.addChild(closeBtn);

    // Title
    this.titleText = new Text({
      text: 'DECKARD CAIN - THE ELDER',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 17, fontWeight: 'bold', fill: 0xd4af37 })
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = panelW / 2;
    this.titleText.y = 14;
    this.container.addChild(this.titleText);

    // Subtitle
    this.subtitleText = new Text({
      text: 'Town of Tristram - Sanctuary of the Living',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 11, fontStyle: 'italic', fill: 0x8f8676 })
    });
    this.subtitleText.anchor.set(0.5, 0);
    this.subtitleText.x = panelW / 2;
    this.subtitleText.y = 38;
    this.container.addChild(this.subtitleText);

    // NPC Tabs (Cain, Griswold, Pepin)
    const tabsY = 60;
    const tabWidth = 140;
    const tabGap = 16;
    const totalTabsWidth = 3 * tabWidth + 2 * tabGap;
    const startTabX = (panelW - totalTabsWidth) / 2;

    const npcs: { id: NPCId; label: string }[] = [
      { id: 'cain', label: 'Cain (Elder)' },
      { id: 'griswold', label: 'Griswold (Smith)' },
      { id: 'pepin', label: 'Pepin (Healer)' }
    ];

    npcs.forEach((npc, index) => {
      const tabBtn = new Container();
      tabBtn.x = startTabX + index * (tabWidth + tabGap);
      tabBtn.y = tabsY;
      tabBtn.eventMode = 'static';
      tabBtn.cursor = 'pointer';

      const tBg = new Graphics();
      tBg.rect(0, 0, tabWidth, 26);
      tBg.fill({ color: 0x1a1622 });
      tBg.stroke({ color: 0x544732, width: 1.5 });
      tabBtn.addChild(tBg);

      const tTxt = new Text({
        text: npc.label,
        style: new TextStyle({ fontFamily: 'serif', fontSize: 11, fontWeight: 'bold', fill: 0xbfa770 })
      });
      tTxt.anchor.set(0.5);
      tTxt.x = tabWidth / 2;
      tTxt.y = 13;
      tabBtn.addChild(tTxt);

      tabBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        this.selectNpc(npc.id);
        this.onSound?.('item_equip');
      });

      this.tabButtons.set(npc.id, tabBtn);
      this.container.addChild(tabBtn);
    });

    // Gold counter
    this.goldText = new Text({
      text: 'Gold: 0',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 13, fontWeight: 'bold', fill: 0xffe680 })
    });
    this.goldText.x = 24;
    this.goldText.y = 96;
    this.container.addChild(this.goldText);

    // NPC Dialogue message box
    this.messageText = new Text({
      text: '',
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
    this.messageText.y = 122;
    this.container.addChild(this.messageText);

    // Actions Container for current NPC
    this.actionsContainer = new Container();
    this.actionsContainer.x = 24;
    this.actionsContainer.y = 188;
    this.container.addChild(this.actionsContainer);

    // Return to Dungeon / Cathedral Entrance Button
    this.returnBtn = new Container();
    this.returnBtn.x = 24;
    this.returnBtn.y = panelH - 52;
    this.returnBtn.eventMode = 'static';
    this.returnBtn.cursor = 'pointer';

    const rBg = new Graphics();
    rBg.rect(0, 0, panelW - 48, 36);
    rBg.fill({ color: 0x122e54 });
    rBg.stroke({ color: 0x3d82d4, width: 2 });
    this.returnBtn.addChild(rBg);

    this.returnBtnText = new Text({
      text: '<< STEP THROUGH TOWN PORTAL >>',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 12, fontWeight: 'bold', fill: 0x8ac4ff })
    });
    this.returnBtnText.anchor.set(0.5);
    this.returnBtnText.x = (panelW - 48) / 2;
    this.returnBtnText.y = 18;
    this.returnBtn.addChild(this.returnBtnText);

    this.returnBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
      if (this.hasActivePortal) {
        this.onSound?.('portal_open');
        this.onReturnToDungeon?.();
      } else {
        this.onSound?.('footstep');
        this.onEnterCathedral?.();
      }
    });

    this.container.addChild(this.returnBtn);
  }

  public open(npc: NPCId = 'cain'): void {
    this.isVisible = true;
    this.container.visible = true;
    this.selectNpc(npc);
  }

  public close(): void {
    this.isVisible = false;
    this.container.visible = false;
  }

  public selectNpc(npc: NPCId): void {
    this.activeNpc = npc;
    this.updateGoldDisplay();
    this.updateTabStyles();
    this.renderNpcActions();
  }

  public updateGoldDisplay(): void {
    this.goldText.text = `Gold: ${this.player.inventory.getTotalGold()}`;
  }

  private updateTabStyles(): void {
    this.tabButtons.forEach((btn, id) => {
      const isSelected = id === this.activeNpc;
      const bg = btn.getChildAt(0) as Graphics;
      const txt = btn.getChildAt(1) as Text;

      bg.clear();
      bg.rect(0, 0, 140, 26);
      bg.fill({ color: isSelected ? 0x382c40 : 0x1a1622 });
      bg.stroke({ color: isSelected ? 0xd4af37 : 0x544732, width: isSelected ? 2 : 1.5 });

      txt.style.fill = isSelected ? 0xfff0aa : 0x998866;
    });

    if (this.hasActivePortal) {
      this.returnBtnText.text = '<< STEP THROUGH TOWN PORTAL (RETURN TO DUNGEON) >>';
    } else {
      this.returnBtnText.text = '<< ENTER CATHEDRAL ENTRANCE (LEVEL 1) >>';
    }
  }

  private renderNpcActions(): void {
    this.actionsContainer.removeChildren();
    let currentY = 0;

    const createActionBtn = (label: string, onClick: () => void) => {
      const btn = new Container();
      btn.x = 0;
      btn.y = currentY;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const bBg = new Graphics();
      bBg.rect(0, 0, 520 - 48, 28);
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

      currentY += 34;
      this.actionsContainer.addChild(btn);
    };

    if (this.activeNpc === 'cain') {
      this.titleText.text = 'DECKARD CAIN - THE ELDER';
      this.messageText.text =
        'Deckard Cain: "Stay a while, and listen! An ancient evil festers beneath the Cathedral. ' +
        'Bring me any mysterious artifacts you uncover, and I shall reveal their hidden enchantments."';

      // 1. Identify Magic Items
      createActionBtn('Identify All Magic Items (100 Gold)', () => {
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

      // 2. Horadric Lore
      createActionBtn('Ask about the Horadrim & the Cathedral (Lore)', () => {
        const loreEntries = [
          'Cain: "The Horadrim imprisoned Diablo deep beneath this very Cathedral centuries ago. But Archbishop Lazarus shattered the Soulstone!"',
          'Cain: "Beware the Butcher on the lower levels. Many brave souls descended into the cellar, but none survived his cleaver."',
          'Cain: "The town portal you cast will anchor your soul between Tristram and the catacombs. Use it wisely when your strength wanes."'
        ];
        this.messageText.text = loreEntries[Math.floor(Math.random() * loreEntries.length)];
        this.onSound?.('item_equip');
      });

    } else if (this.activeNpc === 'griswold') {
      this.titleText.text = 'GRISWOLD - THE BLACKSMITH';
      this.messageText.text =
        'Griswold: "Well, what kin I do fer ya? I forge honest steel to keep the demons at bay. ' +
        'And I have healing draughts and portal scrolls from traveling merchants."';

      // 1. Buy Health Potion
      createActionBtn('Buy Healing Potion (50 Gold)', () => {
        if (this.player.inventory.spendGold(50)) {
          const pot = AffixGenerator.createHealthPotion();
          if (this.player.belt.autoAdd(pot) || this.player.inventory.autoPlace(pot)) {
            this.messageText.text = 'Griswold: "A fresh brew. Keep it handy against the devils below."';
            this.onSound?.('gold_pickup');
            this.updateGoldDisplay();
          } else {
            this.player.inventory.autoPlace(AffixGenerator.createGoldPile(50));
            this.messageText.text = 'Griswold: "Your pack is completely full!"';
          }
        } else {
          this.messageText.text = 'Griswold: "No gold, no goods. Come back when you have 50 coin."';
        }
      });

      // 2. Buy Mana Potion
      createActionBtn('Buy Mana Potion (50 Gold)', () => {
        if (this.player.inventory.spendGold(50)) {
          const pot = AffixGenerator.createManaPotion();
          if (this.player.belt.autoAdd(pot) || this.player.inventory.autoPlace(pot)) {
            this.messageText.text = 'Griswold: "Essence of pure arcane. May it replenish your spellcraft."';
            this.onSound?.('gold_pickup');
            this.updateGoldDisplay();
          } else {
            this.player.inventory.autoPlace(AffixGenerator.createGoldPile(50));
            this.messageText.text = 'Griswold: "Your pack is completely full!"';
          }
        } else {
          this.messageText.text = 'Griswold: "You need 50 gold for a mana potion."';
        }
      });

      // 3. Buy Portal Scroll
      createActionBtn('Buy Town Portal Scroll (100 Gold)', () => {
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

      // 4. Buy Broadsword
      createActionBtn('Buy Broadsword (250 Gold, +4-12 Dmg, +2 Str)', () => {
        if (this.player.inventory.spendGold(250)) {
          const weapon = AffixGenerator.createBroadsword();
          if (this.player.inventory.autoPlace(weapon)) {
            this.messageText.text = 'Griswold: "Balanced and razor sharp. Cleave through those skeletons!"';
            this.onSound?.('item_equip');
            this.updateGoldDisplay();
          } else {
            this.player.inventory.autoPlace(AffixGenerator.createGoldPile(250));
            this.messageText.text = 'Griswold: "Not enough room in your inventory for a broadsword!"';
          }
        } else {
          this.messageText.text = 'Griswold: "A fine blade costs 250 gold. You fall short."';
        }
      });

      // 5. Buy Heater Shield
      createActionBtn('Buy Heater Shield (200 Gold, +8 AC, +25% Block)', () => {
        if (this.player.inventory.spendGold(200)) {
          const shield = AffixGenerator.createHeaterShield();
          if (this.player.inventory.autoPlace(shield)) {
            this.messageText.text = 'Griswold: "Hardened iron oak. It will turn aside many a butcher strike."';
            this.onSound?.('item_equip');
            this.updateGoldDisplay();
          } else {
            this.player.inventory.autoPlace(AffixGenerator.createGoldPile(200));
            this.messageText.text = 'Griswold: "Not enough room in your inventory for a heater shield!"';
          }
        } else {
          this.messageText.text = 'Griswold: "A sturdy shield costs 200 gold."';
        }
      });

    } else if (this.activeNpc === 'pepin') {
      this.titleText.text = 'PEPIN - THE HEALER';
      this.messageText.text =
        'Pepin: "Greetings, traveler. I can see the mortal toll of the dungeon upon you. ' +
        'Rest a moment in Tristram and let the Light heal your flesh and restore your spirit."';

      // 1. Free Healing
      createActionBtn('Restore Full Health & Mana (Free)', () => {
        this.player.stats.currentHp = this.player.stats.maxHp;
        this.player.stats.currentMana = this.player.stats.maxMana;
        this.messageText.text = 'Pepin: "May the divine warmth mend your wounds. You are wholly restored!"';
        this.onSound?.('potion_gulp');
      });

      // 2. Buy Elixir of Vitality (+10 Max HP permanent)
      createActionBtn('Elixir of Vitality (+10 Max HP Permanent) (250 Gold)', () => {
        if (this.player.inventory.spendGold(250)) {
          this.player.stats.vitality += 5;
          this.player.recalculateStats();
          this.player.stats.currentHp = this.player.stats.maxHp;
          this.messageText.text = 'Pepin: "Drink deeply! Your fortitude has permanently strengthened (+10 Max HP)."';
          this.onSound?.('level_up');
          this.updateGoldDisplay();
        } else {
          this.messageText.text = 'Pepin: "Rare herbs and sacred water are costly. Bring 250 gold for the elixir."';
        }
      });
    }
  }
}
