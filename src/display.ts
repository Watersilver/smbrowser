import {Sprite, AnimatedSprite, autoDetectRenderer, Container, Graphics, Filter, DisplayObject, Texture, BaseTexture} from "pixi.js";

// Debug
import loadPlayerSpritesheet from "./assets/load-player-spritesheet"
import { Input } from "./engine";
import { pointVsRect, rectVsRect } from "./engine/aabb";
const graphics = new Graphics();
const input = new Input();

class Display {
  readonly baseWidth = 1280;
  readonly baseHeight = 720;
  readonly aspectRatio = this.baseWidth / this.baseHeight;
  private px = 0;
  private py = 0;
  private width = this.baseWidth;
  private height = this.baseHeight;
  private mousex = 0;
  private mousey = 0;
  private pivotx = 0;
  private pivoty = 0;
  private scale = 1;
  private angle = 0;
  private boundingBox = {l:0,t:0,r:0,b:0,w:0,h:0};
  private boundingBoxRectData = {pos: {x: 0, y: 0}, size: {x: 0, y: 0}};

  changeResolution(newWidth: number) {
    const scale = newWidth / this.baseWidth;
    this.stage.scale.set(scale);
    const newHeight = newWidth / this.aspectRatio;
    this.renderer.resize(newWidth, newHeight);
  }

  private renderer = autoDetectRenderer({
    width: this.baseWidth,
    height: this.baseHeight,
    backgroundColor: "#0f0f00"
  });
  private stage = new Container();
  private effects = new Container();
  private view = new Container();

  constructor() {
    this.view.position.set(this.baseWidth / 2, this.baseHeight / 2);

    const view = this.renderer.view;
    if (!(view instanceof HTMLCanvasElement)) return;
    view.style.aspectRatio = `${this.baseWidth} / ${this.baseHeight}`;

    const display = document.getElementById('display');
    if (!display) return;

    display.append(view);
    this.stage.addChild(this.effects);
    this.effects.addChild(this.view);

    new ResizeObserver(e => {
      for (const entry of e) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w / h > this.aspectRatio) {
          const canvW = h * this.aspectRatio;
          this.width = canvW;
          this.height = h;
        } else {
          const canvH = w / this.aspectRatio;
          this.width = w;
          this.height = canvH;
        }
        this.px = (w - this.width) * 0.5;
        this.py = (h - this.height) * 0.5;
      }
      this.calculateBoundingBox();
    }).observe(view);

    view.addEventListener('mousemove', e => {
      if (e.offsetX > this.px + this.width) return;
      if (e.offsetY > this.py + this.height) return;
      
      const x = e.offsetX - this.px;
      const y = e.offsetY - this.py;

      if (x < 0) return;
      if (y < 0) return;

      this.mousex = x / this.width;
      this.mousey = y / this.height;
    });

    this.calculateBoundingBox();

    // Debug
    this.view.addChild(graphics);
    let sprite = new Sprite();
    loadPlayerSpritesheet().then(([plSheet]) => {
      const idleTex = plSheet.textures['smallIdle'];
      if (idleTex) {
        sprite = new Sprite(idleTex);
        this.add(sprite);
        sprite.position.set(50, 50);
        sprite.anchor.set(0.5);
      }
    });
    this.setScale(2);
    this.setCenter(11, 11);

    const draw = () => {
      input.update();

      if (input.isHeld('KeyA')) this.setAngle(this.angle - 0.1);
      if (input.isHeld('KeyD')) this.setAngle(this.angle + 0.1);
      sprite.position.set(
        ...this.getMousePos()
      );

      graphics.clear();
      graphics.lineStyle(1, 0xff0000, 1);
      graphics.beginFill(0, 0);
      graphics.drawRect(50, 50, 22, 22);
      graphics.endFill();
      const [mx, my] = this.getMousePos();
      graphics.lineStyle(1, 0xff0000, 1);
      graphics.beginFill(0, 0);
      graphics.drawCircle(mx, my, 2);
      graphics.endFill();

      graphics.lineStyle(1, 0xff0000, 1);
      graphics.beginFill(0, 0);
      graphics.drawCircle(-160, -90, 2);
      graphics.endFill();

      graphics.lineStyle(1, 0xff0000, 1);
      graphics.beginFill(0, 0);
      graphics.drawCircle(0, 0, 2);
      graphics.endFill();

      this.render();
      requestAnimationFrame(draw);
    }
    draw();
  }

  toViewport(x: number, y: number): [viewportX: number, viewportY: number] {
    // x = pivx + x0 * cos + y0 * sin
    // y = pivy + y0 * cos - x0 * sin

    // given: (tan + 1 / tan) = 1 / sincos

    // Find viewportX:
    // x / sin = y0 + pivx / sin + x0 / tan
    // y / cos = y0 + pivy / cos - x0 * tan
    // x / sin - y / cos = pivx / sin - pivy / cos + x0 / sincos
    // x0 = x * cos - y * sin + pivy * sin - pivx * cos
    // x0 = (x - pivx) * cos - (y - pivy) * sin
    // (basew * vx / w - posx) / scalex = (x - pivx) * cos - (y - pivy) * sin
    // basew * vx / w - posx = ((x - pivx) * cos - (y - pivy) * sin) * scalex
    // basew * vx / w = ((x - pivx) * cos - (y - pivy) * sin) * scalex + posx
    // vx = (((x - pivx) * cos - (y - pivy) * sin) * scalex + posx) * (w / basew)

    // Find viewportY:
    // x / cos = x0 + pivx / cos + y0 * tan
    // y / sin = pivy / sin + y0 / tan - x0
    // x / cos + y / sin = y0 * (tan + 1 / tan) + pivx / cos + pivy / sin
    // y0 * (sin / cos + cos / sin) = x / cos + y / sin - pivx / cos - pivy / sin
    // y0 * (sin^2 + cos^2) / sincos = x / cos + y / sin - pivx / cos - pivy / sin
    // y0 / sincos = x / cos + y / sin - pivx / cos - pivy / sin
    // y0 = x * sin + y * cos - pivx * sin - pivy * cos
    // y0 = (x - pivx) * sin + (y - pivy) * cos
    // (baseh * vy / h - posy) / scaley = (x - pivx) * sin + (y - pivy) * cos
    // baseh * vy / h - posy = ((x - pivx) * sin + (y - pivy) * cos) * scaley
    // baseh * vy / h = ((x - pivx) * sin + (y - pivy) * cos) * scaley + posy
    // vy = (((x - pivx) * sin + (y - pivy) * cos) * scaley + posy) * (h / baseh)

    const a = this.view.rotation;
    return [
      (((x - this.view.pivot.x) * Math.cos(a) - (y - this.view.pivot.y) * Math.sin(a)) * this.view.scale.x + this.view.position.x) * (this.width / this.baseWidth),
      (((x - this.view.pivot.x) * Math.sin(a) + (y - this.view.pivot.y) * Math.cos(a)) * this.view.scale.y + this.view.position.y) * (this.height / this.baseHeight)
    ];
  }

  fromViewport(viewportX: number, viewportY: number): [x: number, y: number] {
    const x = (this.baseWidth * viewportX / this.width - this.view.position.x) / this.view.scale.x;
    const y = (this.baseHeight * viewportY / this.height - this.view.position.y) / this.view.scale.y;
    const a = this.view.rotation;
    const rotatedX = x * Math.cos(a) + y * Math.sin(a);
    const rotatedY = y * Math.cos(a) - x * Math.sin(a);
    return [
      this.view.pivot.x + rotatedX,
      this.view.pivot.y + rotatedY
    ];
  }

  getMousePos(): [x: number, y: number] {
    return this.fromViewport(this.mousex * this.width, this.mousey * this.height);
  }

  getCenterX() { return this.pivotx; }

  getCenterY() { return this.pivoty; }

  setCenter(x: number, y: number) {
    this.pivotx = x;
    this.pivoty = y;
    this.view.pivot.set(x, y);
  }

  getViewportWidth() { return this.width; }
  getViewportHeight() { return this.height; }

  getScale() { return this.scale; }

  setScale(s: number) {
    this.scale = s;
    this.view.scale.set(s, s);
    this.calculateBoundingBox();
  }

  /** radians */
  setAngle(a: number) {
    this.angle = a;
    this.view.rotation = a;
    this.calculateBoundingBox();
  }

  /** radians */
  getAngle() { return this.angle; }

  add(o: DisplayObject) {
    this.view.addChild(o);
  }

  private calculateBoundingBox() {
    const [x1, y1] = this.fromViewport(0, 0);
    const [x2, y2] = this.fromViewport(this.width, 0);
    const [x3, y3] = this.fromViewport(this.width, this.height);
    const [x4, y4] = this.fromViewport(0, this.height);
    const l = Math.min(x1, x2, x3, x4);
    const t = Math.min(y1, y2, y3, y4);
    const r = Math.max(x1, x2, x3, x4);
    const b = Math.max(y1, y2, y3, y4);
    this.boundingBox.l = l;
    this.boundingBox.r = r;
    this.boundingBox.t = t;
    this.boundingBox.b = b;
    this.boundingBox.w = r - l;
    this.boundingBox.h = b - t;
    this.boundingBoxRectData.pos.x = l;
    this.boundingBoxRectData.pos.y = t;
    this.boundingBoxRectData.size.x = r - l;
    this.boundingBoxRectData.size.y = b - t;
  }

  getBoundingBox(): {
    readonly l: number;
    readonly r: number;
    readonly t: number;
    readonly b: number;
    readonly w: number;
    readonly h: number;
  } {
    return this.boundingBox;
  }

  /** Checks if point inside bounding box */
  containsBroad(point: {x: number, y: number}) {
    pointVsRect(point, this.boundingBoxRectData);
  }

  /** Checks if react overlaps bounding box */
  overlapsRectBroad(rect: {pos: {x: number; y: number;}; size: {x: number; y: number;}}) {
    rectVsRect(rect, this.boundingBoxRectData);
  }

  clamp(l: number, t: number, w: number, h: number) {
    // Ensure camera is within given bounds by chaging pivot and scale

    const wcomp = w > this.boundingBox.w;
    const hcomp = h > this.boundingBox.h;

    if (wcomp && hcomp) {
      // if bounding box is smaller than given rect just ensure that it is within rect
      if (this.boundingBox.l < l) this.pivotx = l + this.boundingBox.w * 0.5;
      if (this.boundingBox.r > l + w) this.pivotx = l + w - this.boundingBox.w * 0.5;
      if (this.boundingBox.t < t) this.pivoty = t + this.boundingBox.h * 0.5;
      if (this.boundingBox.t > t + h) this.pivoty = t + h - this.boundingBox.h * 0.5;
    } else {
      // if bounding box is larger, first move to center of given rect, then scale until smaller or equal
      this.pivotx = l + w * 0.5;
      this.pivoty = t + h * 0.5;

      const ratio = Math.max(this.boundingBox.w / w, this.boundingBox.h / h);
      this.setScale(this.scale * ratio);
    }
    this.setCenter(this.pivotx, this.pivoty);
  }

  render() {
    this.renderer.render(this.stage);
  }
};

const display = new Display();

(window as any).display = display;

export default display;