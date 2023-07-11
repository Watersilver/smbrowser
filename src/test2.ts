import './style.css'
import './config'

import {Sprite, AnimatedSprite, autoDetectRenderer, Container, Graphics, Filter} from "pixi.js"
import loadPlayerSpritesheet from "./assets/load-player-spritesheet"
import { Input, Loop, Vec2d } from "./engine"

import SpatialHashTable from './engine/spatial-hash-table'
import { dynamicRectVsDynamicRect, dynamicRectVsRect, rayVsRect, rectVsRect } from './engine/aabb'

import AudioController from './engine/audio-controller'
import song from './assets/physdemo.mp3'
import song2 from "./assets/rayman.mp3"

import sJump from "./assets/jump.wav"
import sLand from "./assets/land.wav"
import step from "./assets/step.wav"

let started = false;

const sht = new SpatialHashTable<{
  plRectVRect?: boolean;
  rayCol?: {normal: Vec2d, point: Vec2d};
  type: "static" | "dynamic" | "kinematic";
  vel?: Vec2d;
  startPos?: Vec2d;
}>(32);

const audCont = new AudioController();
const mp = audCont.createMusicPlayer({
  phys: song,
  ray: song2
});
const sp = audCont.createSoundPlayer({
  jump: sJump,
  land: sLand,
  step
});
sp.setVolume(0.5);

const graphics = new Graphics();

// Replace with non empty function when dom is ready
let playMusicFromRadios = () => {};

const collider = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};
const collidee = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};

const gravity = 500;

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
  camView = new Container();

  units: ReturnType<typeof sht['create']>[] = [];

  readonly ray = {
    start: new Vec2d(55, 55),
    end: new Vec2d(66, 66)
  }

  readonly debug = document.createElement('div');

  period = 0;
  grounded = false;
  jumped = false;
  showSprites = true;

  plSpritesContainer = new Container();
  plSprites?: {
    walk: AnimatedSprite & {prevFrame?: number; prevSound?: number};
    idle: Sprite;
    jump: Sprite;
  }

  biggestFPS = 0;
  smallestFPS = Infinity;
  biggestFPSView = this.biggestFPS;
  smallestFPSView = this.biggestFPS;

  constructor() {
    super();
    this.stage.addChild(this.camView);
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
      this.debug.style.color = "red";
      gameEl.append(this.debug);

      const sprToggle = document.getElementById('sprite-toggle');
      sprToggle?.addEventListener('click', () => this.showSprites = !this.showSprites);

      const infoToggle = document.getElementById('info-toggle');
      const info = document.getElementById('info');
      infoToggle?.addEventListener('click', () => {
        if (!info) return;
        if (info.style.display === "none") {
          info.style.display = "block";
        } else {
          info.style.display = "none";
        }
      });

      const toolsToggle = document.getElementById('tools-toggle');
      const tools = document.getElementById('tools');
      toolsToggle?.addEventListener('click', () => {
        if (!tools) return;
        if (tools.style.display === "none") {
          tools.style.display = "flex";
        } else {
          tools.style.display = "none";
        }
      });

      const masterVolume = document.getElementById('master-volume');
      if (masterVolume instanceof HTMLInputElement) {
        audCont.setVolume(parseFloat(masterVolume.value));
        masterVolume.addEventListener('input', () => {
          audCont.setVolume(parseFloat(masterVolume.value));
        });
      }

      const musicVolume = document.getElementById('music-volume');
      if (musicVolume instanceof HTMLInputElement) {
        mp.setVolume(parseFloat(musicVolume.value));
        musicVolume.addEventListener('input', () => {
          mp.setVolume(parseFloat(musicVolume.value));
        });
      }

      const soundVolume = document.getElementById('sound-volume');
      if (soundVolume instanceof HTMLInputElement) {
        sp.setVolume(parseFloat(soundVolume.value));
        soundVolume.addEventListener('input', () => {
          sp.setVolume(parseFloat(soundVolume.value));
        });
      }

      const radios = document.getElementsByName("music");
      const radioHandlers: (() => void)[] = [];
      playMusicFromRadios = () => radioHandlers.forEach(r => r());
      for (const radio of radios) {
        if (radio instanceof HTMLInputElement) {
          const playMusicFromRadio = () => {
            if (radio.checked) {
              if (radio.value === "phys") {
                mp.setMusic({
                  fadeOutPrev: 2,
                  name: 'phys',
                  loopStart: 22.736
                });
              } else if (radio.value === "rayman") {
                mp.setMusic({
                  fadeOutPrev: 0.3,
                  silence: 1.7,
                  name: 'ray',
                  loopStart: 12.826
                });
              } else {
                mp.setMusic({
                  fadeOutPrev: 3,
                });
              }
            }
          }
          radio.addEventListener('change', playMusicFromRadio);
          radioHandlers.push(playMusicFromRadio);
        }
      }
    }
  }

  private async load() {
    this.units.push(sht.create(-16,11,16,16,{type: "dynamic"}));
    this.units.push(sht.create(82,82,3,3,{type: "static"}));
    this.units.push(sht.create(-30,100,30,30,{type: "static"}));
    this.units.push(sht.create(0,100,30,30,{type: "static"}));
    this.units.push(sht.create(60,100,30,30,{type: "static"}));
    this.units.push(sht.create(30,100,30,30,{type: "static"}));
    this.units.push(sht.create(-30,160,30,30,{type: "static"}));
    this.units.push(sht.create(-30,130,30,30,{type: "static"}));
    this.units.push(sht.create(-60,70,30,30,{type: "static"}));
    this.units.push(sht.create(100,50,40,5,{type: "kinematic"}));

    this.camView.position.set(this.baseWidth / 2, this.baseHeight / 2);

    this.camView.addChild(graphics);
    this.camView.addChild(this.plSpritesContainer);

    const [plSheet] = await loadPlayerSpritesheet();

    const walkTex = plSheet.animations['smallWalk'];
    const idleTex = plSheet.textures['smallIdle'];
    const jumpTex = plSheet.textures['smallJump'];
    if (walkTex && idleTex && jumpTex) {
      this.plSprites = {
        walk: new AnimatedSprite(walkTex),
        idle: new Sprite(idleTex),
        jump: new Sprite(jumpTex)
      }
      const f = new Filter(undefined, `
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        void main(void)
        {
          vec4 c = texture2D(uSampler, vTextureCoord);
          if (
            (c.x > 0.57 && c.x < 0.58 && c.y > 0.56 && c.y < 0.57 && c.z > 0.99)
            ||
            (c.x < 0.01 && c.y > 0.16 && c.y < 0.17 && c.z > 0.54 && c.z < 0.55)
          ) {
            gl_FragColor = vec4(0.0,0.0,0.0,0.0);
          } else {
            gl_FragColor = texture2D(uSampler, vTextureCoord);
          }
        }
      `);
      this.plSpritesContainer.filters = [f];
      this.plSpritesContainer.addChild(this.plSprites.walk);
      this.plSpritesContainer.addChild(this.plSprites.idle);
      this.plSpritesContainer.addChild(this.plSprites.jump);
      this.plSprites.jump.anchor.set(0.5);
      this.plSprites.idle.anchor.set(0.5);
      this.plSprites.walk.anchor.set(0.5);
      this.plSprites.walk.play();

      console.log(plSheet);
    };
  }

  protected override onStart(): void {
    this.load();

    setInterval(() => {
      this.biggestFPSView = this.biggestFPS;
      this.biggestFPS = 0;
      this.smallestFPSView = this.smallestFPS;
      this.smallestFPS = Infinity;
    }, 1000);
  }

  protected override onFrameDraw(): void {
    const dt = this.input.isHeld("ShiftLeft") ? 0.01 : this.dt;
    const fps = Math.floor(1 / this.dt);
    if (this.smallestFPS > fps) this.smallestFPS = fps;
    if (this.biggestFPS < fps) this.biggestFPS = fps;
    if (started) this.debug.innerHTML = "fps: " + fps + "<br>max-fps: " + this.biggestFPSView + "<br>min-fps: " + this.smallestFPSView;

    this.period += Math.min(1/60, dt);
    while (this.period >= 2 * Math.PI) {
      this.period -= 2 * Math.PI;
    }

    const pl = this.units.find(u => u.userData.type === "dynamic");

    this.input.update();

    let v1x = 0;
    let v1y = 0;
    let v2x = 0;
    let v2y = 0;
    let v3x = 0;
    let v3y = 0;

    if (this.input.isHeld("ArrowRight")) v1x += 1;
    if (this.input.isHeld("ArrowLeft")) v1x -= 1;
    if (this.input.isHeld("ArrowDown")) v1y += 1;
    if (this.input.isHeld("ArrowUp")) v1y -= 1;

    if (this.input.isHeld("KeyH")) v2x += 1;
    if (this.input.isHeld("KeyF")) v2x -= 1;
    if (this.input.isHeld("KeyG")) v2y += 1;
    if (this.input.isHeld("KeyT")) v2y -= 1;

    if (this.input.isHeld("KeyD")) v3x += 1;
    if (this.input.isHeld("KeyA")) v3x -= 1;
    if (this.input.isHeld("KeyS")) v3y += 1;
    if (this.input.isHeld("KeyW")) v3y -= 1;

    if (this.input.isPressed("KeyR") && pl) {
      pl.l = -16;
      pl.t = 11;
      if (pl.userData.vel) {
        pl.userData.vel.x = 0;
        pl.userData.vel.y = 0;
      }
      sht.update(pl);
    }

    const vel1 = new Vec2d(v1x, v1y).unit();
    const vel2 = new Vec2d(v2x, v2y).unit();
    const vel3 = new Vec2d(v3x, v3y).unit();

    this.ray.start = this.ray.start.add(vel1.mul(55 * dt));
    this.ray.end = this.ray.end.add(vel2.mul(55 * dt));

    for (const u of this.units) {
      u.userData.startPos = u.userData.startPos || new Vec2d(u.l, u.t);
      u.userData.plRectVRect = false;
      delete u.userData.rayCol;
    }

    // apply acceleration
    if (started) for (const d of this.units) {
      if (d.userData.type === "static") continue;
      const vel = d.userData.vel || new Vec2d(0, 0);
      d.userData.vel = vel;

      if (d.userData.type === "kinematic") {
        const displacement = new Vec2d(1, 1).unit().mul(-Math.cos(this.period) * 66);
        if (d.userData.startPos) {
          const lnext = d.userData.startPos.x + displacement.x;
          const tnext = d.userData.startPos.y + displacement.y;
          vel.x = lnext - d.l;
          vel.y = tnext - d.t;
        }
      } else {
        let g = gravity;
        if (d === pl && this.input.isHeld("KeyW") && pl.userData.vel?.y && pl.userData.vel.y < 0) {
          g *= 0.5;
        }
        d.userData.vel.y += g * dt;
      }
    }

    // Test ray
    for (const u of this.units) {
      collidee.pos.x = u.l;
      collidee.pos.y = u.t;
      collidee.size.x = u.w;
      collidee.size.y = u.h;
      const [hit, col] = rayVsRect({
        origin: this.ray.start,
        direction: this.ray.end.sub(this.ray.start)
      }, collidee);
      if (hit) u.userData.rayCol = col;
    }

    // Clamp velocity
    const maxspeed = 200 * 60;
    for (const u of this.units) {
      if (!u.userData.vel) continue;
      if (u.userData.vel.length() > maxspeed) {
        const maxvel = u.userData.vel.unit().mul(maxspeed);
        u.userData.vel.x = maxvel.x;
        u.userData.vel.y = maxvel.y;
      }
    }

    if (started) if (pl?.userData.vel) {
      pl.userData.vel.x = vel3.x * 44;
      // pl.userData.vel.y = vel3.y * 44;

      if (vel3.y > 0) {
        if (pl.userData.vel.y > 0) pl.userData.vel.y += pl.userData.vel.y * 0.1;
      } else if (vel3.y < 0 && this.grounded) {
        pl.userData.vel.y = -155
        this.jumped = true;
        sp.play('jump', {sleep: 0.2});
      }
    }

    // Test dynamic cols
    for (const d of this.units) {
      if (d.userData.type !== "dynamic" || !d.userData.vel) continue;

      const dr = d.userData.vel.mul(dt);

      collider.pos.x = d.l;
      collider.pos.y = d.t;
      collider.size.x = d.w;
      collider.size.y = d.h;
      collider.dr.x = dr.x;
      collider.dr.y = dr.y;

      const l = dr.x < 0 ? d.l + dr.x : d.l;
      const t = dr.y < 0 ? d.t + dr.y : d.t;
      const w = dr.x < 0 ? d.w - dr.x : d.w + dr.x;
      const h = dr.y < 0 ? d.h - dr.y : d.h + dr.y;

      // Store potential collisions
      const collisions: [edginess: number, u: {l: number, t: number, w: number, h: number, userData: {vel?: Vec2d}}][] = [];
      for (const u of sht.findNear(l, t, w, h)) {

        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;

        if (u.userData.vel) {
          collidee.dr.x = u.userData.vel.x * dt;
          collidee.dr.y = u.userData.vel.y * dt;
        }

        const [hit, col] = u.userData.vel ? dynamicRectVsDynamicRect(collider, collidee) : dynamicRectVsRect(collider, collidee);

        if (hit) {
          collisions.push([col.edginess, u]);
        }
      }

      // sort collisions by closest
      const sorted = collisions
      // using edginess (how close to an edge our collision point is)
      // adjusted: was collision time, but some times it would be zero and still resulted in getting stuck to edges
      .sort((a, b) => b[0] - a[0]);

      // resolve collisions
      for (const [_, u] of sorted) {
        const updatedDr = d.userData.vel.mul(dt);;
        collider.dr.x = updatedDr.x;
        collider.dr.y = updatedDr.y;

        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;

        if (u.userData.vel) {
          collidee.dr.x = u.userData.vel.x * dt;
          collidee.dr.y = u.userData.vel.y * dt;
        }

        const [hit, col] = u.userData.vel ? dynamicRectVsDynamicRect(collider, collidee) : dynamicRectVsRect(collider, collidee);

        if (hit) {
          const correction =
            u.userData.vel
            ? d.userData.vel.sub(u.userData.vel).abs().elementwiseMul(col.normal).mul(1-col.time)
            : d.userData.vel.abs().elementwiseMul(col.normal).mul(1-col.time);
            d.userData.vel.x += correction.x;
            d.userData.vel.y += correction.y;
        }
      }
    }

    if (pl) {
      // Test rect overlap
      const rect1 = {pos: new Vec2d(pl.l, pl.t), size: new Vec2d(pl.w, pl.h)};
      for (const u of sht.findNear(pl.l, pl.t, pl.w, pl.h)) {
        if (u === pl) continue;

        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;
        const o = rectVsRect(rect1, collidee);
        u.userData.plRectVRect = o;
        pl.userData.plRectVRect = pl.userData.plRectVRect || o;
      }

      // Test if grounded
      const groundedPrev = this.grounded;
      this.grounded = false;
      collider.dr.x = 0;
      collider.dr.y = 1;
      collidee.dr.x = 0;
      collidee.dr.y = 0;
      for (const u of sht.findNear(pl.l, pl.t + 1, pl.w, pl.h)) {
        if (u === pl) continue;

        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;
        const [hit] = dynamicRectVsRect(collider, collidee);

        if (hit) {
          this.grounded = true;
          this.jumped = false;
          break;
        }
      }
      if (!groundedPrev && this.grounded) {
        sp.play('land');
      }
    }

    // Move dynamics and kinematics
    if (started) for (const d of this.units) {
      if (d.userData.type === "static" || !d.userData.vel) continue;

      d.l += d.userData.vel.x * dt;
      d.t += d.userData.vel.y * dt;
      sht.update(d);
    }

    // Draw graphics
    graphics.clear();
    
    if (pl) {
      for (const [i, j] of sht.findNearCells(pl.l, pl.t, pl.w, pl.h + 1)) {
        graphics.lineStyle(1, 0x0f0000, 1);
        graphics.beginFill(0x000, 0);
        graphics.drawRect(
          i * sht.size,
          j * sht.size,
          sht.size,
          sht.size
        );
        graphics.endFill();
      }
    }

    // Draw ray
    graphics.lineStyle(1, 0xffff00, 1);
    graphics.beginFill(0x000, 0);
    graphics.drawCircle(this.ray.start.x, this.ray.start.y, 2);
    graphics.moveTo(this.ray.start.x, this.ray.start.y);
    graphics.lineTo(this.ray.end.x, this.ray.end.y);
    graphics.endFill();

    for (const u of this.units) {
      if (u === pl && this.showSprites) continue;

      const col =
        u.userData.type === "kinematic"
        ? 0xa0f0c0
        : u.userData.type === "dynamic"
        ? 0xc0a0f0
        : 0xf0a0c0;
      graphics.lineStyle(1, col, 1);
      graphics.beginFill(0xff0000, u.userData.plRectVRect ? 0.2 : 0);
      graphics.drawRect(u.l, u.t, u.w, u.h);
      graphics.endFill();

      const c = u.userData.rayCol;
      if (c) {
        graphics.lineStyle(1, 0xccffaa, 1);
        graphics.beginFill(0x000, 0);
        graphics.drawCircle(c.point.x, c.point.y, 1);
        graphics.moveTo(c.point.x, c.point.y);
        const n = c.point.add(c.normal.mul(10));
        graphics.lineTo(n.x, n.y);
        graphics.endFill();
      }
    }

    if (this.grounded && pl && !this.showSprites) {
      graphics.lineStyle(1, 0xff0000, 1);
      graphics.beginFill(0xff0000, 0);
      graphics.moveTo(pl.l, pl.t + pl.h);
      graphics.lineTo(pl.l + pl.w, pl.t + pl.h);
      graphics.endFill();
    }

    // Draw sprites
    if (this.showSprites) {
      this.plSpritesContainer.visible = true;
    } else {
      this.plSpritesContainer.visible = false;
    }

    if (this.plSprites && pl) {
      const xspeed = Math.abs(pl.userData.vel?.x ?? 0);

      if (vel3.x > 0) {
        this.plSpritesContainer.scale.x = 1;
      } else if (vel3.x < 0) {
        this.plSpritesContainer.scale.x = -1;
      }

      let anim: "walk" | "idle" | "jump" = "idle";
      if (xspeed !== 0 || !this.grounded) {
        anim = 'walk';
      }
      if (this.jumped) {
        anim = 'jump';
      }
      
      this.plSprites.walk.visible = anim === 'walk';
      this.plSprites.idle.visible = anim === 'idle';
      this.plSprites.jump.visible = anim === 'jump';

      this.plSprites.walk.animationSpeed = 12 * dt * xspeed / 44;
      if (!this.grounded) this.plSprites.walk.animationSpeed = 0;

      if (anim === 'walk' && this.grounded && this.showSprites) {
        if (
          this.plSprites.walk.prevFrame !== this.plSprites.walk.currentFrame
          && this.plSprites.walk.currentFrame === 2
        ) {
          sp.play('step')
          this.plSprites.walk.prevSound = this.plSprites.walk.prevSound || 0;
          this.plSprites.walk.prevSound++;
          if (this.plSprites.walk.prevSound > 3) {
            this.plSprites.walk.prevSound = 0;
          }
        }
      }

      this.plSprites.walk.prevFrame = this.plSprites.walk.currentFrame;

      this.plSpritesContainer.position.set(pl.l + pl.w * 0.5, pl.t + pl.h * 0.5);
    }

    // using pivot like this centers camera
    this.camView.pivot.set(pl?.l, pl?.t);
    this.camView.pivot.set(this.ray.start.x, this.ray.start.y);
    this.camView.scale.set(3);
    this.renderer.render(this.stage);
  }
}

const ml = new MainLoop();
ml.start();
ml.input.stop();

const startButton = document.createElement('div');
startButton.style.position = "absolute";
startButton.style.top = "0px";
startButton.style.left = "0px";
startButton.style.right = "0px";
startButton.style.bottom = "0px";
startButton.style.backdropFilter = "blur(2px)";
startButton.style.cursor = "pointer";
startButton.style.display = "grid";
startButton.style.justifyItems = "center";
startButton.style.alignItems = "center";
const playDiv = document.createElement('div');
playDiv.style.border = "90px solid transparent";
playDiv.style.borderRight = "130px solid transparent";
playDiv.style.borderLeft = "130px solid #ffffff66";
playDiv.style.transform = "translateX(25%)";
startButton.append(playDiv);
audCont.loadingDone().then(() => {
  console.log("music loaded");
  startButton.onclick = () => {
    startButton.remove();
    ml.input.start();
    (window as any).mainLoop = ml;
    started = true;
    audCont.init();
    playMusicFromRadios();
  }
});
document.body.append(startButton);
