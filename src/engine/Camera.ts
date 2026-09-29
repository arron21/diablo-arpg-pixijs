import { Point2D } from './IsoMath';

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public zoom: number = 1.0;

  // Screen shake properties
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  // Viewport dimensions
  public viewportWidth: number = 1280;
  public viewportHeight: number = 720;

  constructor(viewportWidth: number = 1280, viewportHeight: number = 720) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public setViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  public jumpTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  public shake(intensity: number = 6, durationMs: number = 200): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = durationMs;
  }

  public update(deltaMs: number): void {
    // Smooth camera tracking (lerp)
    const factor = Math.min(1, (deltaMs / 1000) * 10);
    this.x += (this.targetX - this.x) * factor;
    this.y += (this.targetY - this.y) * factor;

    // Handle screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaMs;
      const progress = Math.max(0, this.shakeDuration);
      const currentIntensity = this.shakeIntensity * (progress / 200);
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  /**
   * Returns current effective camera screen origin (including shake and center offset).
   */
  public getScreenOffset(): Point2D {
    return {
      x: Math.round(this.viewportWidth / 2 - this.x + this.shakeOffsetX),
      y: Math.round(this.viewportHeight / 2 - this.y + this.shakeOffsetY)
    };
  }

  /**
   * Converts mouse screen position to world coordinates taking camera offset into account.
   */
  public screenToWorld(clientX: number, clientY: number): Point2D {
    const offset = this.getScreenOffset();
    return {
      x: clientX - offset.x,
      y: clientY - offset.y
    };
  }
}
