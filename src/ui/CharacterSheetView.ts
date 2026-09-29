import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player';

export class CharacterSheetView {
  public readonly container: Container;
  public isVisible: boolean = false;

  private player: Player;
  private onSound?: (key: string) => void;

  private statsText: Text;
  private plusButtons: Container[] = [];

  constructor(player: Player, onSound?: (key: string) => void) {
    this.player = player;
    this.onSound = onSound;
    this.container = new Container();
    this.container.visible = false;
    this.container.eventMode = 'static';

    const panelW = 300;
    const panelH = 420;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, panelW, panelH);
    bg.fill({ color: 0x121017, alpha: 0.96 });
    bg.stroke({ color: 0x544833, width: 2.5 });
    this.container.addChild(bg);

    // Title
    const title = new Text({
      text: 'WARRIOR ATTRIBUTES',
      style: new TextStyle({ fontFamily: 'serif', fontSize: 14, fontWeight: 'bold', fill: 0xd4af37 })
    });
    title.anchor.set(0.5, 0);
    title.x = panelW / 2;
    title.y = 10;
    this.container.addChild(title);

    // Close button
    const closeBtn = new Container();
    closeBtn.x = panelW - 24;
    closeBtn.y = 8;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    const closeBg = new Graphics();
    closeBg.rect(0, 0, 16, 16);
    closeBg.fill({ color: 0x3d1717 });
    closeBg.stroke({ color: 0x782d2d, width: 1 });
    closeBtn.addChild(closeBg);
    const closeTxt = new Text({ text: 'X', style: new TextStyle({ fontFamily: 'serif', fontSize: 10, fill: 0xffffff }) });
    closeTxt.anchor.set(0.5);
    closeTxt.x = 8;
    closeTxt.y = 8;
    closeBtn.addChild(closeTxt);
    closeBtn.on('pointerdown', () => this.toggle());
    this.container.addChild(closeBtn);

    // Stats Text
    this.statsText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'serif',
        fontSize: 12,
        fill: 0xdecba4,
        lineHeight: 22
      })
    });
    this.statsText.x = 24;
    this.statsText.y = 45;
    this.container.addChild(this.statsText);

    // Plus buttons for Strength, Magic, Dexterity, Vitality
    const attributes: ('strength' | 'magic' | 'dexterity' | 'vitality')[] = [
      'strength', 'magic', 'dexterity', 'vitality'
    ];

    attributes.forEach((attr, idx) => {
      const btn = new Container();
      btn.x = 210;
      btn.y = 112 + idx * 22;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';

      const bBg = new Graphics();
      bBg.rect(0, 0, 18, 18);
      bBg.fill({ color: 0xb5891b });
      bBg.stroke({ color: 0xffec80, width: 1 });
      btn.addChild(bBg);

      const bTxt = new Text({ text: '+', style: new TextStyle({ fontFamily: 'serif', fontSize: 13, fontWeight: 'bold', fill: 0x000000 }) });
      bTxt.anchor.set(0.5);
      bTxt.x = 9;
      bTxt.y = 9;
      btn.addChild(bTxt);

      btn.on('pointerdown', (e) => {
        e.stopPropagation();
        if (this.player.allocateStat(attr)) {
          this.onSound?.('item_equip');
          this.refresh();
        }
      });

      this.plusButtons.push(btn);
      this.container.addChild(btn);
    });

    this.refresh();
  }

  public toggle(): boolean {
    this.isVisible = !this.isVisible;
    this.container.visible = this.isVisible;
    if (this.isVisible) {
      this.refresh();
      this.onSound?.('item_equip');
    }
    return this.isVisible;
  }

  public refresh(): void {
    const p = this.player;
    const canSpend = p.unspentStatPoints > 0;

    for (const btn of this.plusButtons) {
      btn.visible = canSpend;
    }

    const lines = [
      `Level: ${p.stats.level} (Warrior)`,
      `Experience: ${p.currentXp} / ${p.nextLevelXp}`,
      `Stat Points: ${p.unspentStatPoints}`,
      `-----------------------------`,
      `Strength:  ${p.stats.strength}`,
      `Magic:     ${p.stats.magic}`,
      `Dexterity: ${p.stats.dexterity}`,
      `Vitality:  ${p.stats.vitality}`,
      `-----------------------------`,
      `Life:      ${p.stats.currentHp} / ${p.stats.maxHp}`,
      `Mana:      ${p.stats.currentMana} / ${p.stats.maxMana}`,
      `Damage:    ${p.stats.minDamage} - ${p.stats.maxDamage}`,
      `To-Hit:    +${p.stats.toHit}%`,
      `Armor:     ${p.stats.armorClass}`,
      `Block:     ${p.stats.hasShield ? `${p.stats.baseBlockChance}%` : 'None'}`,
      `Light:     +${p.stats.lightRadiusBonus}`
    ];

    this.statsText.text = lines.join('\n');
  }
}
