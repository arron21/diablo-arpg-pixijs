import { Container, Sprite } from 'pixi.js';
import { Direction8 } from '../graphics/AssetFactory';
import { gridToScreen, calculateDepth } from '../engine/IsoMath';
import { CombatStats } from '../combat/CombatEngine';

export enum ActionState {
  IDLE = 'idle',
  WALK = 'walk',
  ATTACK = 'attack',
  BLOCK = 'block',
  HIT_RECOVERY = 'hit',
  DEAD = 'dead'
}

export abstract class Entity {
  public id: string;
  public gx: number;
  public gy: number;
  public direction: Direction8 = 2; // Default facing South
  public state: ActionState = ActionState.IDLE;

  public stats: CombatStats;

  public readonly spriteContainer: Container;
  protected sprite: Sprite;

  // Animation timing
  protected animTimer: number = 0;
  protected animFrame: number = 0;
  protected stateTimer: number = 0;

  constructor(id: string, gx: number, gy: number, stats: CombatStats) {
    this.id = id;
    this.gx = gx;
    this.gy = gy;
    this.stats = stats;

    this.spriteContainer = new Container();
    this.sprite = new Sprite();
    this.sprite.anchor.set(0.5, 0.7); // Anchor at feet
    this.spriteContainer.addChild(this.sprite);

    this.updateScreenPosition();
  }

  public updateScreenPosition(): void {
    const screenPos = gridToScreen(this.gx, this.gy);
    this.spriteContainer.x = screenPos.x + 32;
    this.spriteContainer.y = screenPos.y + 16;
    this.spriteContainer.zIndex = calculateDepth(this.gx, this.gy, 30);
  }

  public setDirectionFromDelta(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    // Calculate angle in radians: 0 is East (+gx), PI/2 is South (+gy)
    const angle = Math.atan2(dy, dx); // -PI to PI
    // Map to 8 directions: 0: E, 1: SE, 2: S, 3: SW, 4: W, 5: NW, 6: N, 7: NE
    let deg = (angle * 180) / Math.PI;
    if (deg < 0) deg += 360;
    const dir = Math.round(deg / 45) % 8;
    this.direction = dir as Direction8;
  }

  public abstract update(deltaMs: number): void;
}
