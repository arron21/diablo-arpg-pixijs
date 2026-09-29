import { Point2D } from '../engine/IsoMath';

export interface InputState {
  mouseScreen: Point2D;
  isLeftDown: boolean;
  isRightDown: boolean;
  isShiftDown: boolean;
  // WASD movement vector (-1 to 1)
  moveAxisX: number;
  moveAxisY: number;
  hasWasdMovement: boolean;
}

export type InputKeyCallback = (key: string) => void;

export class InputManager {
  private domElement: HTMLElement;
  public state: InputState = {
    mouseScreen: { x: 0, y: 0 },
    isLeftDown: false,
    isRightDown: false,
    isShiftDown: false,
    moveAxisX: 0,
    moveAxisY: 0,
    hasWasdMovement: false,
  };

  private keysDown: Set<string> = new Set();
  private keyListeners: InputKeyCallback[] = [];

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.setupListeners();
  }

  public onKeyDown(callback: InputKeyCallback): () => void {
    this.keyListeners.push(callback);
    return () => {
      this.keyListeners = this.keyListeners.filter(cb => cb !== callback);
    };
  }

  private setupListeners(): void {
    // Prevent context menu so right click works as skill trigger
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
      const rect = this.domElement.getBoundingClientRect();
      this.state.mouseScreen.x = e.clientX - rect.left;
      this.state.mouseScreen.y = e.clientY - rect.top;
    });

    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.state.isLeftDown = true;
      } else if (e.button === 2) {
        this.state.isRightDown = true;
      }
      this.state.isShiftDown = e.shiftKey;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.state.isLeftDown = false;
      } else if (e.button === 2) {
        this.state.isRightDown = false;
      }
      this.state.isShiftDown = e.shiftKey;
    });

    // Keyboard tracking
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
      this.state.isShiftDown = e.shiftKey;
      this.updateMovementAxis();

      // Trigger hotkeys
      for (const listener of this.keyListeners) {
        listener(e.code);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.state.isShiftDown = e.shiftKey;
      this.updateMovementAxis();
    });
  }

  private updateMovementAxis(): void {
    let dx = 0;
    let dy = 0;

    // Isometric-aligned WASD movement:
    // W moves Up-Left in isometric (or -gx, -gy), S moves Down-Right (+gx, +gy)
    // A moves Down-Left (-gx, +gy), D moves Up-Right (+gx, -gy)
    // In screen isometric terms:
    // Pressing W moves player towards top of screen (decreases both gx and gy)
    // Pressing S moves player towards bottom of screen (increases both gx and gy)
    // Pressing A moves player towards left of screen (decreases gx, increases gy)
    // Pressing D moves player towards right of screen (increases gx, decreases gy)
    const isW = this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp');
    const isS = this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown');
    const isA = this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft');
    const isD = this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight');

    if (isW) { dx -= 1; dy -= 1; }
    if (isS) { dx += 1; dy += 1; }
    if (isA) { dx -= 1; dy += 1; }
    if (isD) { dx += 1; dy -= 1; }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      this.state.moveAxisX = dx / len;
      this.state.moveAxisY = dy / len;
      this.state.hasWasdMovement = true;
    } else {
      this.state.moveAxisX = 0;
      this.state.moveAxisY = 0;
      this.state.hasWasdMovement = false;
    }
  }
}
