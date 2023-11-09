import { Graphics } from "pixi.js";
import State from "../engine/state-machine";
import { Input } from "../engine";
import { LineSeg, OscillationInit, PlatformConnection, Points, Vine } from "../types";
import LevelEditor from "./LevelEditor";
import entities from "../entities";
import level from '../assets/level.json';
import parseLevel from "../systems/parseLevel";
import Culling from "../systems/culling";
import display from "../display";
import camera from "../systems/camera";

export type TitleIn = {
  graphics: Graphics;
  input: Input;
}

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

export default class Title extends State<'gameplay', TitleIn | null, TitleOut | null> {
  graphics?: Graphics;
  input?: Input;
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

  override onStart(i: TitleIn): void {
    this.graphics = i.graphics;
    this.input = i.input;
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
    this.culling.cullAll();

    // Temp
    const m = entities.view(['mario'])[0];
    if (m) {
      display.setCenter(m.position.x, m.position.y);
    }
  }

  override onUpdate(dt: number): boolean {
    entities.update();
    this.culling.update(display);
    camera(display);
    if (this.input) {
      return !this.input.isPressed('Enter');
    }
    return true;
  }

  override onEnd(): [TitleOut | null, 'gameplay'] {
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