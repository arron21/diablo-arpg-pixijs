import { Container, Text, TextStyle } from 'pixi.js';

export interface FloatMessage {
  text: string;
  color: number;
  x: number;
  y: number;
  lifeMs: number;
  maxLifeMs: number;
  pixiText: Text;
}

export class FloatingTextManager {
  private container: Container;
  private messages: FloatMessage[] = [];

  constructor(container: Container) {
    this.container = container;
  }

  public spawn(text: string, screenX: number, screenY: number, color: number = 0xffffff): void {
    const style = new TextStyle({
      fontFamily: 'serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: color,
      stroke: { color: 0x000000, width: 3 },
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 2,
        color: 0x000000,
        distance: 2
      }
    });

    const pixiText = new Text({ text, style });
    pixiText.x = screenX - 10 + (Math.random() * 20 - 10);
    pixiText.y = screenY - 20;
    pixiText.zIndex = 99999;

    this.container.addChild(pixiText);

    this.messages.push({
      text,
      color,
      x: pixiText.x,
      y: pixiText.y,
      lifeMs: 800,
      maxLifeMs: 800,
      pixiText
    });
  }

  public update(deltaMs: number): void {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      msg.lifeMs -= deltaMs;

      if (msg.lifeMs <= 0) {
        this.container.removeChild(msg.pixiText);
        msg.pixiText.destroy();
        this.messages.splice(i, 1);
      } else {
        const progress = msg.lifeMs / msg.maxLifeMs;
        // Float upward
        msg.pixiText.y -= (deltaMs / 1000) * 35;
        // Fade out in last 50% of life
        msg.pixiText.alpha = Math.min(1, progress * 1.5);
      }
    }
  }
}
