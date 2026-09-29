import { Container } from 'pixi.js';

export class LayerManager {
  public readonly stage: Container;

  // World root moves with the camera
  public readonly worldRoot: Container;
  public readonly floorLayer: Container;
  public readonly worldObjectLayer: Container;
  public readonly entityLayer: Container;
  public readonly fxLayer: Container;
  public readonly lightingLayer: Container;

  // UI root stays static on the screen
  public readonly uiRoot: Container;
  public readonly automapLayer: Container;
  public readonly hudLayer: Container;
  public readonly modalLayer: Container;
  public readonly tooltipLayer: Container;

  constructor(stage: Container) {
    this.stage = stage;

    // Build World Containers
    this.worldRoot = new Container();
    this.floorLayer = new Container();
    this.worldObjectLayer = new Container();
    this.entityLayer = new Container();
    this.fxLayer = new Container();
    this.lightingLayer = new Container();

    // Enable zIndex sorting for entities and world objects
    this.entityLayer.sortableChildren = true;
    this.worldObjectLayer.sortableChildren = true;

    this.worldRoot.addChild(this.floorLayer);
    this.worldRoot.addChild(this.worldObjectLayer);
    this.worldRoot.addChild(this.entityLayer);
    this.worldRoot.addChild(this.fxLayer);
    this.worldRoot.addChild(this.lightingLayer);

    // Build UI Containers
    this.uiRoot = new Container();
    this.automapLayer = new Container();
    this.hudLayer = new Container();
    this.modalLayer = new Container();
    this.tooltipLayer = new Container();

    this.uiRoot.addChild(this.automapLayer);
    this.uiRoot.addChild(this.hudLayer);
    this.uiRoot.addChild(this.modalLayer);
    this.uiRoot.addChild(this.tooltipLayer);

    // Add to stage
    this.stage.addChild(this.worldRoot);
    this.stage.addChild(this.uiRoot);
  }

  public updateCameraOffset(offsetX: number, offsetY: number): void {
    this.worldRoot.x = offsetX;
    this.worldRoot.y = offsetY;
  }
}
