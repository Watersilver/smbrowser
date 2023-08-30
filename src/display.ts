import {autoDetectRenderer, Container, DisplayObject} from "pixi.js"
import { pointVsRect, rectVsRect } from "./engine/aabb"

type TransformEffect = Generator<{x?: number; y?: number; angle?: number; scale?: number}, void, void>;

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

  private targetX?: number;
  private targetY?: number;
  private targetScale?: number;

  // Lerp speed when changing position
  private posLerp?: number = 700;
  // Percentage moved when changing position
  private posPerc?: number = 0.9 * 3;
  // Percentage scaled when changing scale
  private scalePerc?: number = 0.99 * 6;

  private transformEffects: Set<TransformEffect> = new Set();

  changeResolution(newWidth: number) {
    const scale = newWidth / this.baseWidth;
    this.stage.scale.set(scale);
    const newHeight = newWidth / this.aspectRatio;
    this.renderer.resize(newWidth, newHeight);
  }

  readonly renderer = autoDetectRenderer({
    width: this.baseWidth,
    height: this.baseHeight,
    backgroundColor: "#900C3F"
  });
  private stage = new Container();
  private effects = new Container();
  private view = new Container();

  private currentFPS = 0;
  private biggestFPS = 0;
  private smallestFPS = Infinity;
  private biggestFPSView = this.biggestFPS;
  private smallestFPSView = this.biggestFPS;
  private fpsInterval?: number;
  private fpsDisplay?: HTMLDivElement;
  private prev = performance.now();

  private updateFps(dt: number) {
    const fps = Math.floor(1 / dt);
    this.currentFPS = fps;
    if (this.smallestFPS > fps) this.smallestFPS = fps;
    if (this.biggestFPS < fps) this.biggestFPS = fps;
    if (this.fpsDisplay) this.fpsDisplay.innerHTML = "fps: " + fps + "<br>max-fps: " + this.biggestFPSView + "<br>min-fps: " + this.smallestFPSView;
    if (this.fpsInterval !== undefined) requestAnimationFrame(timestamp => {
      const dt = (timestamp - this.prev) / 1000;
      this.prev = timestamp;
      this.updateFps(dt);
    });
  }

  getFps() {
    return this.currentFPS;
  }

  /** Max fps last second */
  getMaxFps() {
    return this.biggestFPSView;
  }

  /** Min fps last second */
  getMinFps() {
    return this.smallestFPSView;
  }

  showFps() {
    this.fpsDisplay = document.createElement('div');
    this.fpsDisplay.style.color = "red";
    this.fpsDisplay.style.position = "fixed";
    this.fpsDisplay.style.left = "0px";
    this.fpsDisplay.style.top = "0px";

    const display = document.getElementById('display');
    if (!display) return;
    display.append(this.fpsDisplay);
  }

  hideFps() {
    this.fpsDisplay?.remove();
    this.fpsDisplay = undefined;
  }

  countFps() {
    if (this.fpsInterval !== undefined) return;
    this.fpsInterval = window.setInterval(() => {
      this.biggestFPSView = this.biggestFPS;
      this.biggestFPS = 0;
      this.smallestFPSView = this.smallestFPS;
      this.smallestFPS = Infinity;
    }, 1000);
    this.updateFps(Infinity);
  }

  stopFpsCount() {
    clearInterval(this.fpsInterval);
    this.fpsInterval = undefined;
  }

  constructor() {
    this.view.eventMode = 'none';
    this.view.sortableChildren = true;

    // Keep following in mind if I want to implement split screen
    // Also it seems cloning the render tree is the only way
    // const mask = new Graphics();
    // mask.beginFill();
    // mask.drawRect(0, 0, 111, 111);
    // mask.endFill();
    // this.view.mask = mask; // Note that mask is influenced by scale

    this.view.position.set(this.baseWidth / 2, this.baseHeight / 2);

    const view = this.renderer.view;
    if (!(view instanceof HTMLCanvasElement)) return;

    const display = document.getElementById('display');
    if (!display) return;

    display.append(view);
    this.stage.addChild(this.effects);
    this.effects.addChild(this.view);

    // Track changes to canvas width and height as well as padding
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

      // Height changed so recompute bounding box
      this.computeBoundingBox();
    }).observe(view);

    // Track mouse position relative to canvas
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

    // initialize bounding box
    this.computeBoundingBox();
  }

  getCanvas() {
    const view = this.renderer.view;
    if (!(view instanceof HTMLCanvasElement)) return;
    return view;
  }

  setBGColor(c: any) {
    this.renderer.background.backgroundColor.setValue(c);
  }

  setBGAlpha(alpha: number) {
    this.renderer.background.alpha = alpha;
  }

  toViewport(x: number, y: number): [viewportX: number, viewportY: number] {
    // following x, y are world coordinates
    // given:
    // x = pivx + x0 * cos + y0 * sin
    // y = pivy + y0 * cos - x0 * sin
    // (tan + 1 / tan) = 1 / sincos

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

  getMouseViewportPos(): [x: number, y: number] {
    return [this.mousex * this.width, this.mousey * this.height];
  }

  getCenterX() { return this.pivotx; }

  getCenterY() { return this.pivoty; }

  private _setCenter(x: number, y: number) {
    this.pivotx = x;
    this.pivoty = y;
    this.view.pivot.set(x, y);

    // Center changed so recompute bounding box
    this.computeBoundingBox();
  }

  setCenter(x: number, y: number) {
    this._setCenter(x, y);
    this.targetX = this.pivotx;
    this.targetY = this.pivoty;
  }

  moveToCenter(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  getViewportWidth() { return this.width; }
  getViewportHeight() { return this.height; }

  getScale() { return this.scale; }

  private _setScale(s: number) {
    this.scale = s;
    this.view.scale.set(s, s);

    // Scale changed so recompute bounding box
    this.computeBoundingBox();
  }

  setScale(s: number) {
    this._setScale(s);
    this.targetScale = this.scale;
  }

  moveToScale(s: number) {
    this.targetScale = s;
  }

  /** radians */
  setAngle(a: number) {
    this.angle = a;
    this.view.rotation = a;

    // Angle changed so recompute bounding box
    this.computeBoundingBox();
  }

  /** radians */
  getAngle() { return this.angle; }

  add(o: DisplayObject) {
    this.view.addChild(o);
  }

  private computeBoundingBox() {
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
    return pointVsRect(point, this.boundingBoxRectData);
  }

  /** Checks if react overlaps bounding box */
  overlapsRectBroad(rect: {pos: {x: number; y: number;}; size: {x: number; y: number;}}) {
    return rectVsRect(rect, this.boundingBoxRectData);
  }

  clamp(l: number, t: number, w: number, h: number) {
    const prevScale = this.scale;
    const prevX = this.pivotx;
    const prevY = this.pivoty;
    const clamp = this.computeClamp(this.pivotx, this.pivoty, this.scale, l,t,w,h);
    if (prevX !== clamp.targetX || prevY !== clamp.targetY) {
      this.setCenter(clamp.targetX, clamp.targetY);
    }
    this.targetX = clamp.targetX;
    this.targetY = clamp.targetY;
    if (prevScale !== clamp.targetScale) {
      this.setScale(clamp.targetScale);
    }
    this.targetScale = clamp.targetScale;
  }

  moveToClamp(targetX: number, targetY: number, targetScale: number, l: number, t: number, w: number, h: number) {
    const prevX = this.getCenterX();
    const prevY = this.getCenterY();
    const prevScale = this.getScale();
    this._setCenter(targetX, targetY);
    this._setScale(targetScale);
    const clamp = this.computeClamp(targetX, targetY, targetScale, l,t,w,h);
    this.targetX = clamp.targetX;
    this.targetY = clamp.targetY;
    this.targetScale = clamp.targetScale;
    this._setCenter(prevX, prevY);
    this._setScale(prevScale);
  }

  private computeClamp(targetX: number, targetY: number, targetScale: number, l: number, t: number, w: number, h: number) {
    // Ensure camera is within given bounds by chaging pivot and scale

    const wbigger = w > this.boundingBox.w;
    const hbigger = h > this.boundingBox.h;

    if (wbigger && hbigger) {
      // if bounding box is smaller than given rect just ensure that it is within rect
      if (this.boundingBox.l < l) targetX = l + this.boundingBox.w * 0.5;
      if (this.boundingBox.r > l + w) targetX = l + w - this.boundingBox.w * 0.5;
      if (this.boundingBox.t < t) targetY = t + this.boundingBox.h * 0.5;
      if (this.boundingBox.b > t + h) targetY = t + h - this.boundingBox.h * 0.5;
    } else {
      // if bounding box is larger, first move to center of dimensions where overlap occurs,
      // then scale until smaller or equal
      if (!wbigger && !hbigger) {
        const ratio = Math.max(this.boundingBox.w / w, this.boundingBox.h / h);
        targetScale = this.scale * ratio;
        const prevScale = this.scale;
        this._setScale(targetScale);
        if (this.boundingBox.l < l) targetX = l + this.boundingBox.w * 0.5;
        if (this.boundingBox.r > l + w) targetX = l + w - this.boundingBox.w * 0.5;
        if (this.boundingBox.t < t) targetY = t + this.boundingBox.h * 0.5;
        if (this.boundingBox.b > t + h) targetY = t + h - this.boundingBox.h * 0.5;
        this._setScale(prevScale);
      } else if (!wbigger) {
        targetX = l + w * 0.5;
        const prevScale = this.scale;
        targetScale = this.scale * this.boundingBox.w / w;
        this._setScale(targetScale);
        if (this.boundingBox.t < t) targetY = t + this.boundingBox.h * 0.5;
        if (this.boundingBox.b > t + h) targetY = t + h - this.boundingBox.h * 0.5;
        this._setScale(prevScale);
      } else {
        targetY = t + h * 0.5;
        const prevScale = this.scale;
        targetScale = this.scale * this.boundingBox.h / h;
        this._setScale(targetScale);
        if (this.boundingBox.l < l) targetX = l + this.boundingBox.w * 0.5;
        if (this.boundingBox.r > l + w) targetX = l + w - this.boundingBox.w * 0.5;
        this._setScale(prevScale);
      }
    }

    return {
      targetX,
      targetY,
      targetScale
    };
  }

  pushEffect(e: TransformEffect) {
    this.transformEffects.add(e);
  }

  stopMoveTo() {
    this.targetScale = undefined;
    this.targetX = undefined;
    this.targetY = undefined;
  }

  private computeDeltaOf(dimension: "x" | "y", dt: number) {
    let delta = 0;
    let target = dimension === 'x' ? this.targetX : this.targetY;
    if (target !== undefined) {
      const diff = target - (dimension === 'x' ? this.pivotx : this.pivoty);
      if (this.posPerc) {
        delta = diff * this.posPerc * dt;
      }
      if (this.posLerp) {
        const lerp = Math.sign(diff) * this.posLerp * dt;
        if (Math.abs(delta) < Math.abs(lerp)) {
          delta = lerp;
        }
      }
      if (Math.abs(diff) < Math.abs(delta)) {
        delta = diff;
      }
    }
    return delta;
  }
  update(dt: number) {
    let dx = this.computeDeltaOf('x', dt), dy = this.computeDeltaOf('y', dt), ds = 0;
    this._setCenter(this.pivotx + dx, this.pivoty + dy);

    if (this.targetScale) {
      const diff = this.targetScale - this.scale;
      if (this.scalePerc) {
        ds = Math.sign(diff) * this.scalePerc * dt;
      }
      if (Math.abs(diff) < Math.abs(ds)) {
        ds = diff;
      }
    }
    this._setScale(this.scale + ds);
  }

  render() {
    this.effects.position.set(0);
    this.effects.scale.set(1);
    this.effects.rotation = 0;

    for (const e of this.transformEffects) {
      const v = e.next();
      if (v.done) this.transformEffects.delete(e);
      else {
        if (v.value.x) this.effects.position.x += v.value.x;
        if (v.value.y) this.effects.position.y += v.value.y;
        if (v.value.angle) this.effects.rotation += v.value.angle;
        if (v.value.scale) {
          this.effects.scale.x += v.value.scale;
          this.effects.scale.y += v.value.scale;
        }
      }
    }

    this.renderer.render(this.stage);
  }
};

const display = new Display();
export default display;

export type {Display};