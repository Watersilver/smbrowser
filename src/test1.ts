import './style.css'
import './config'

import {Assets, Sprite, autoDetectRenderer, Container, AnimatedSprite, Graphics} from "pixi.js"
import { Input, Loop, Vec2d } from "./engine"

import test from "./assets/Test.png"
import loadPlayerSpritesheet from "./assets/load-player-spritesheet"

import SpatialHashTable from './engine/spatial-hash-table'
import AABB from './engine/aabb.old'

const sht = new SpatialHashTable(32);

const graphics = new Graphics();

const collider = new AABB(0,0,0,0);
const collidee = new AABB(0,0,0,0);

class MainLoop extends Loop {
  readonly baseWidth = 1280;
  readonly baseHeight = 720;
  readonly aspectRatio = this.baseWidth / this.baseHeight;

  changeResolution(newWidth: number) {
    const scale = newWidth / this.baseWidth;
    this.stage.scale.set(scale);
    const newHeight = newWidth / this.aspectRatio;
    this.renderer.resize(newWidth, newHeight);
  }

  renderer = autoDetectRenderer({
    width: this.baseWidth,
    height: this.baseHeight,
    backgroundColor: "#0f0f00"
  });
  input = new Input();
  stage = new Container();
  gameCameraView = new Container();

  test?: Sprite;
  private test2?: AnimatedSprite;

  units: ReturnType<SpatialHashTable<unknown>['create']>[] = [];

  readonly debug = document.createElement('div');

  readonly mouse = {relativeX: 0, relativeY: 0, x: 0, y: 0};

  constructor() {
    super();
    this.stage.addChild(this.gameCameraView);
    const gameEl = document.getElementById('game');
    if (gameEl && this.renderer.view instanceof HTMLCanvasElement) {
      const container = document.createElement('div');
      // Use flexbox to control child's size
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "stretch";
      container.style.width = "100%";
      container.style.height = "100%";

      // Use contain to retain aspect ratio
      this.renderer.view.style.objectFit = "contain";
      // Use max width and height to be able to shrink
      this.renderer.view.style.maxHeight = "100%";
      this.renderer.view.style.maxWidth = "100%";

      container.append(this.renderer.view);
      gameEl.append(container);

      this.debug.style.position = "absolute";
      this.debug.style.left = "0px";
      this.debug.style.top = "0px";
      gameEl.append(this.debug);

      const v = this.renderer.view;

      v.addEventListener('mousemove', e => {
        
        const bounds = v.getBoundingClientRect();
        if (!bounds) return;

        const ar = bounds.width / bounds.height;

        const w = ar > this.aspectRatio ? bounds.height * this.aspectRatio : bounds.width;
        const h = ar > this.aspectRatio ? bounds.height : bounds.width / this.aspectRatio;
        const t = (bounds.height - h) * .5;
        const l = (bounds.width - w) * .5;

        this.mouse.relativeX = (e.clientX - l) / w;
        this.mouse.relativeY = (e.clientY - t) / h;
      })
    }
    // this.renderer.addListener('resize', () => {});
  }

  private async load() {
    let testTexture = await Assets.load(test);
    this.test = new Sprite(testTexture);

    const [plSheet] = await loadPlayerSpritesheet();

    const walkTex = plSheet.animations['smallWalk'];
    if (walkTex) {
      this.test2 = new AnimatedSprite(walkTex);
      this.gameCameraView.addChild(this.test2);
      this.test2.position.set(25, 25);

      console.log(plSheet)
    };

    this.units.push(sht.create(0,0,0,0,null));
    this.units.push(sht.create(82,82,3,3,null));
    this.units.push(sht.create(-30,100,30,30,null));
    this.units.push(sht.create(0,100,30,30,null));
    this.units.push(sht.create(60,100,30,30,null));
    this.units.push(sht.create(30,100,30,30,null));
    this.units.push(sht.create(-30,130,30,30,null));

    this.test.position.set(50, 50);
    this.gameCameraView.addChild(this.test);
    this.gameCameraView.position.set(this.baseWidth / 2, this.baseHeight / 2);

    this.gameCameraView.addChild(graphics)
  }

  protected override onStart(): void {
    this.load();
  }

  protected override onFrameDraw(): void {
    const dt = this.dt;

    this.input.update();

    let vx = 0;
    let vy = 0;

    if (this.input.isHeld("ArrowRight")) vx += 1;
    if (this.input.isHeld("ArrowLeft")) vx -= 1;
    if (this.input.isHeld("ArrowDown")) vy += 1;
    if (this.input.isHeld("ArrowUp")) vy -= 1;

    const vel = new Vec2d(vx, vy).unit().mul(55);

    const plu = this.units[0];
    if (plu && this.test) {
      plu.l = this.test.position.x;
      plu.t = this.test.position.y;
      plu.w = this.test.width;
      plu.h = this.test.height;
      sht.update(plu);
    }

    const other = this.units[1];

    const cam = this.gameCameraView;
    this.mouse.x = cam.pivot.x + (this.baseWidth * this.mouse.relativeX - this.baseWidth / 2) / cam.scale.x;
    this.mouse.y = cam.pivot.y + (this.baseHeight * this.mouse.relativeY - this.baseHeight / 2) / cam.scale.y;

    graphics.clear();
    graphics.lineStyle(0);
    // graphics.beginFill(0xDE3249, 1);
    // graphics.drawCircle(this.test?.position.x ?? 0, this.test?.position.y ?? 0, 1);
    // graphics.endFill();

    // Hash table test
    for (const [i, j] of sht.findNearCells(this.test?.position.x ?? 0, this.test?.position.y ?? 0, this.test?.width ?? 0, this.test?.height ?? 0)) {
      graphics.lineStyle(0.5, 0x000, 1);
      graphics.beginFill(0x000, 0);
      graphics.drawRect(i * sht.size, j * sht.size, sht.size, sht.size);
      graphics.endFill();
    }

    for (const u of this.units) {
      graphics.lineStyle(1, 0x00ffac, 1);
      graphics.beginFill(0x000, 0);
      graphics.drawRect(u.l, u.t, u.w, u.h);
      graphics.endFill();
    }

    if (plu) {
      collider.pos.x = plu.l;
      collider.pos.y = plu.t;
      collider.size.x = plu.w;
      collider.size.y = plu.h;

      const posDisplacement = vel.mul(dt);
      const l = posDisplacement.x < 0 ? plu.l + posDisplacement.x : plu.l;
      const t = posDisplacement.y < 0 ? plu.t + posDisplacement.y : plu.t;
      const w = posDisplacement.x < 0 ? plu.w - posDisplacement.x : plu.w + posDisplacement.x;
      const h = posDisplacement.y < 0 ? plu.h - posDisplacement.y : plu.h + posDisplacement.y;

      const near: {l: number; t: number; w: number; h: number;}[] = [];

      graphics.lineStyle(1, 0x00ffff, 0.5);
      graphics.beginFill(0x000, 0);
      graphics.drawRect(l, t, w, h);
      graphics.endFill();

      // Detect collisions
      for (const u of sht.findNear(l, t, w, h)) {
        if (u === plu) continue;

        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;

        // Different colors depending on overlap
        if (collider.overlaps(collidee)) {
          graphics.lineStyle(1, 0xffffff, 1);
          graphics.beginFill(0x000, 0);
          graphics.drawRect(u.l, u.t, u.w, u.h);
          graphics.endFill();
        } else {
          graphics.lineStyle(1, 0xffff00, 1);
          graphics.beginFill(0x000, 0);
          graphics.drawRect(u.l, u.t, u.w, u.h);
          graphics.endFill();
        }

        near.push(u);
      }

      // Resolve collisions
      const origin = collider.pos.add(collider.size.div(2));

      graphics.lineStyle(1, 0, 0);
      graphics.beginFill(0xff0000, 1);
      graphics.drawCircle(origin.x, origin.y, 2);
      graphics.endFill();

      graphics.lineStyle(1, 0xffff00, 0.5);
      graphics.beginFill(0, 0);
      graphics.moveTo(origin.x, origin.y);
      const v = origin.add(posDisplacement.mul(10));
      graphics.lineTo(v.x, v.y);
      graphics.endFill();

      for (const u of near) {
        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;

        const pos = collider.size.mul(-0.5).add(collidee.pos);
        const size = collider.size.add(collidee.size);

        graphics.lineStyle(1, 0xff0000, 1);
        graphics.beginFill(0x000, 0);
        graphics.drawRect(pos.x, pos.y, size.x, size.y);
        graphics.endFill();
      }

      const collisions = near.map(u => {
        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;

        const res = collider.willCollide(posDisplacement, collidee);

        return {u, res};
      })
      .sort((a, b) => ((a.res[2] ?? 0) - (b.res[2] ?? 0)));

      for (const c of collisions) {
        collidee.pos.x = c.u.l;
        collidee.pos.y = c.u.t;
        collidee.size.x = c.u.w;
        collidee.size.y = c.u.h;

        // vel changes after resolution so we need to recalculate here
        const pd = vel.mul(dt);
        const [hit, col, t] = collider.willCollide(pd, collidee);

        if (hit) {
          const correction = vel.abs().elementwiseMul(col.normal).mul(1-t);
          vel.x += correction.x;
          vel.y += correction.y;
        }
      }
    }

    if (this.test && (vel.x || vel.y)) {
      this.test.position.x += vel.x * dt;
      this.test.position.y += vel.y * dt;
    }

    // test ray
    if (other && this.test) {
      collidee.pos.x = other.l;
      collidee.pos.y = other.t;
      collidee.size.x = other.w;
      collidee.size.y = other.h;

      const direction = new Vec2d(this.mouse.x, this.mouse.y).sub(this.test);
      const [hit, col, t] = collidee.vsRay({origin: this.test, direction});

      if (hit) {
        graphics.lineStyle(1, 0xffff00, 1);
        graphics.beginFill(0, 0);
        graphics.moveTo(this.test.x, this.test.y);
        graphics.lineTo(this.mouse.x, this.mouse.y);
        graphics.endFill();

        graphics.lineStyle(1, 0xffff00, 1);
        graphics.beginFill(0, 0);
        graphics.moveTo(col.point.x, col.point.y);
        const n = col.normal.mul(10).add(col.point);
        graphics.lineTo(n.x, n.y);
        graphics.endFill();
      } else {
        graphics.lineStyle(1, 0x00ffff, 1);
        graphics.beginFill(0, 0);
        graphics.moveTo(this.test.x, this.test.y);
        graphics.lineTo(this.mouse.x, this.mouse.y);
        graphics.endFill();
      }
    }

    // using pivot like this centers camera
    if (this.test) this.gameCameraView.pivot.set(this.test.x, this.test.y);
    this.gameCameraView.scale.set(3);
    this.renderer.render(this.stage);
  }
}

const ml = new MainLoop();
ml.start();
(window as any).mainLoop = ml;