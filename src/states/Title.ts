import { Graphics, Container, Text } from "pixi.js";
import State from "../engine/state-machine";
import { Input, Vec2d } from "../engine";
import { LineSeg, OscillationInit, PlatformConnection, Points, Vine } from "../types";
import LevelEditor from "./LevelEditor";
import entities, { Entity, newEntity } from "../entities";
import level from '../assets/level.json';
import parseLevel from "../systems/parseLevel";
import Culling from "../systems/culling";
import display from "../display";
import camera from "../systems/camera";
import Overlay from "../systems/overlay";
import { getSmb1Audio } from "../audio";

export type TitleIn = {
  graphics: Graphics;
  input: Input;
  mario?: Container; title?: Container; text?: Text
} | null;

export type TitleOut = {
  graphics: Graphics;
  input: Input;
  zones: LevelEditor['zones'];
  pipes: Points[];
  vines: Vine[];
  trampolines: Vine[];
  oscillations: OscillationInit[];
  platformRoutes: LineSeg[];
  platformConnections: PlatformConnection[];
}

const audio = getSmb1Audio();

export default class Title extends State<'gameplay', TitleIn | null, TitleOut | null> {
  graphics?: Graphics;
  input?: Input;
  mario?: Container;
  title?: Container;
  text?: Text;
  zones: LevelEditor['zones'] = {
    camZones: [],
    camPreserveZones: [],
    deathZones: [],
    underwaterZones: [],
    whirlpoolZones: [],
    surfaceZones: [],
    noMarioInputZones: [],
    descendingPlatformZones: [],
    jumpCheepZones: [],
    cheepZones: [],
    lakituZones: [],
    billZones: [],
    fireZones: [],
    maskZones: [],
    angrySunZones: [],
    medusaHeadZones: [],
    loopZones: [],
    unloadZones: [],
    darkbgZones: [],
    checkpointZones: []
  };
  vines: Vine[] = [];
  pipes: Points[] = [];
  trampolines: Vine[] = [];
  oscillations: OscillationInit[] = [];
  platformRoutes: LineSeg[] = [];
  platformConnections: PlatformConnection[] = [];
  culling = new Culling();

  camCenter: Entity | null = null;
  alpha = 1;
  gzInit: any;
  timer = 3;

  overlay = new Overlay(display);

  t = 0;
  t2 = 0;

  override onStart(i: TitleIn): void {
    this.overlay = new Overlay(display);
    this.graphics = i?.graphics;
    if (i?.mario) this.mario = i.mario;
    if (i?.title) this.title = i.title;
    if (i?.text) this.text = i.text;
    if (this.graphics) {
      this.graphics.zIndex = 999999;
      this.gzInit = this.graphics.zIndex;
    }
    this.input = i?.input;
    entities.clear();
    const ld = parseLevel(level as any);
    entities.update();
    for (const [key, val] of Object.entries(this.zones)) {
      val.length = 0;
      val.push(...((ld.parsed as any)[key] || []))
    }

    if (ld.parsed.pipes) this.pipes = ld.parsed.pipes;
    if (ld.parsed.vines) this.vines = ld.parsed.vines;
    if (ld.parsed.trampolines) this.trampolines = ld.parsed.trampolines;
    if (ld.parsed.oscillations) this.oscillations = ld.parsed.oscillations;
    if (ld.parsed.platformRoutes) this.platformRoutes = ld.parsed.platformRoutes;
    if (ld.parsed.platformConnections) this.platformConnections = ld.parsed.platformConnections;

    this.culling = new Culling();
    // this.culling.cullAll();

    this.camCenter = entities.createEntity(newEntity({forceCam: true, position: new Vec2d(0, -400)}));

    display.setCenter(0, -400);
  }

  private hexLerp(max: string, progress: number) {
    max = '0x' + max;
    const n = Math.floor(Number(max) * progress);
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  override onUpdate(dt: number): boolean {
    this.t += dt;

    if (this.title) {
      this.title.position.y = Math.sin(this.t) * 7;
      this.title.angle = Math.sin(this.t * 0.61803398) * 5;
      if (this.mario) {
        this.mario.angle = Math.sin(this.t * Math.PI * 0.5) * 4;
        this.mario.position.y = this.title.parent.position.y + Math.sin(this.t * Math.PI * 0.161803398 + 2) * 14;
      }

      if (!this.timer && this.text) {
        this.t2 += dt;
        this.text.visible = Math.sin(this.t2 * 4) < 0;
      }
    }

    this.timer -= dt;
    if (this.timer <= 0) this.timer = 0;
    this.alpha -= dt * 0.5;
    if (this.alpha <= 0) this.alpha = 0;
    entities.update();
    this.culling.update(display);
    this.overlay.update(dt, false, true);
    camera(display);

    const g = this.graphics;
    if (g) {
      g.clear();

      const {l,t,b,r} = display.getBoundingBox();
      g.lineStyle(1, 0x000000, this.alpha);
      g.beginFill(0x000000, this.alpha);
      g.drawRect(
        l,
        t,
        r - l,
        b - t
      );
      g.endFill();
    }
    display.setBGColor(
      '#'
      + this.hexLerp('92', 1 - this.alpha)
      + this.hexLerp('90', 1 - this.alpha)
      + this.hexLerp('ff', 1 - this.alpha)
    );
    if (this.input && !this.timer) {
      const enter = this.input.isPressed('Enter');
      if (enter) audio.controller.init();
      return !enter;
    }
    return true;
  }

  override onEnd(): [TitleOut | null, 'gameplay'] {
    this.overlay.destroy();
    if (this.graphics) this.graphics.zIndex = this.gzInit;
    if (this.camCenter) entities.remove(this.camCenter);
    this.camCenter = null;
    if (!this.graphics || !this.input) return [null, 'gameplay'];
    return [{
      graphics: this.graphics,
      input: this.input,
      zones: this.zones,
      pipes: this.pipes,
      vines: this.vines,
      trampolines: this.trampolines,
      oscillations: this.oscillations,
      platformRoutes: this.platformRoutes,
      platformConnections: this.platformConnections
    }, "gameplay"];
  }
}