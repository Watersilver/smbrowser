import {Sprite, AnimatedSprite, autoDetectRenderer, Container, Graphics, Filter, DisplayObject, Texture, BaseTexture} from "pixi.js";

// Debug
import loadPlayerSpritesheet from "./assets/load-player-spritesheet"
const graphics = new Graphics();

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
  private view1 = new Container();

  constructor() {
    this.view1.position.set(this.baseWidth / 2, this.baseHeight / 2);

    const view = this.renderer.view;
    if (!(view instanceof HTMLCanvasElement)) return;
    view.style.aspectRatio = `${this.baseWidth} / ${this.baseHeight}`;

    const display = document.getElementById('display');
    if (!display) return;

    display.append(view);
    this.stage.addChild(this.view1);

    // Maintain canvas aspect ratio with resize observer
    // const r = new ResizeObserver(e => {
    //   const entry = e[0];
    //   if (!entry) return;
    //   const {width, height} = entry.contentRect;
    //   const ar = width / height;
    //   if (ar > this.aspectRatio) {
    //     view.style.height = "100%";
    //     view.style.width = 'unset';
    //   } else {
    //     view.style.width = "100%";
    //     view.style.height = 'unset';
    //   }
    // });
    // r.observe(display);

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

    // Debug
    this.view1.addChild(graphics);
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

    const draw = () => {
      sprite.position.set(
        this.getMouseX(),
        this.getMouseY()
      );

      this.setCenter(11, 11);
      this.setScale(2);

      this.render();
      requestAnimationFrame(draw);
    }
    draw();
  }

  /** TODO */
  toScreen() {

  }

  /** TODO */
  toClient() {

  }

  /** TODO */
  toViewport() {

  }

  /** TODO */
  fromScreen(screenX: number, screenY: number) {

  }

  /** TODO */
  fromClient(clientX: number, clientY: number) {

  }

  /** TODO */
  fromViewport(viewportX: number, viewportY: number) {

  }

  getMouseX() {
    return this.view1.pivot.x + (this.mousex * this.baseWidth - this.view1.position.x) / this.view1.scale.x;
  }

  getMouseY() {
    return this.view1.pivot.y + (this.mousey * this.baseHeight - this.view1.position.y) / this.view1.scale.y;
  }

  getCenterX() {
    return this.pivotx;
  }

  getCenterY() {
    return this.pivoty;
  }

  setCenter(x: number, y: number) {
    this.pivotx = x;
    this.pivoty = y;
    this.view1.pivot.set(x, y);
  }

  getScale() {
    return this.scale;
  }

  setScale(s: number) {
    this.scale = s;
    this.view1.scale.set(s, s);
  }

  add(o: DisplayObject) {
    this.view1.addChild(o);
  }

  render() {
    graphics.lineStyle(1, 0xff0000, 1);
    graphics.beginFill(0, 0);
    graphics.drawRect(50, 50, 22, 22);
    graphics.endFill();
    this.renderer.render(this.stage);
  }
}

const display = new Display();

(window as any).display = display;

export default display;