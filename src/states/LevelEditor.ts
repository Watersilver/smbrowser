import { Graphics } from "pixi.js";
import State from "../engine/state-machine";
import display from "../display";
import { Input, Vec2d } from "../engine";
import mouseCamMove from "../systems/mouseCamMove";
import debugRender from "../systems/debugRender";
import renderSmb1Mario from "../systems/renderSmb1Mario";
import marioSmb1Sounds from "../systems/marioSmb1Sounds";
import entities, { Entity } from "../entities";
import parseLevel from "../systems/parseLevel";
import { EntityTypeMapping, LevelData } from "../types";
import culling from "../systems/culling";

// TODO: Camera clamper polygon

// TODO: Maek game

export type LevelEditorInit = {
  graphics: Graphics;
  input: Input;
  levelDataInit?: string;
}

export default class LevelEditor extends State<'gameplay', LevelEditorInit | null, LevelEditorInit | null> {
  graphics?: Graphics;
  input?: Input;
  levelDataInit?: string;

  mouseX = 0;
  mouseY = 0;
  mousePrevX = 0;
  mousePrevY = 0;
  spanVel = new Vec2d(0, 0);
  grid: {
    [position: string]: {
        gameObj: Entity;
        init: [type: EntityTypeMapping, x: number, y: number, init?: {}, custom?: Entity];
    };
  } = {};

  scale = 1;

  remove(x: number, y: number) {
    const key = (Math.floor(x / 16) * 16) + "." + (Math.floor(y / 16) * 16);
    const e = this.grid[key];
    delete this.grid[key];
    if (e?.gameObj) entities.remove(e.gameObj);
  }

  add(entity: LevelData['entities'][number]) {
    const {grid} = parseLevel({entities: [entity]});
    for (const [pos, e] of Object.entries(grid)) {
      const prev = this.grid[pos];
      delete this.grid[pos];
      if (prev?.gameObj) entities.remove(prev.gameObj);
      this.grid[pos] = e;
    }
  }

  override onStart(init: LevelEditorInit | null): void {
    if (!init) return;
    entities.clear();
    this.scale = display.getScale();
    this.graphics = init.graphics;
    this.input = init.input;
    this.levelDataInit = init.levelDataInit || this.levelDataInit;
    if (this.levelDataInit) {
      const ld = parseLevel(this.levelDataInit);
      this.grid = ld.grid;
    }
  }

  override onEnd(): [output: LevelEditorInit | null, next: 'gameplay'] {
    if (!this.graphics || !this.input) return [null, 'gameplay'];
    const graphics = this.graphics;
    const input = this.input;
    return [{
      graphics,
      input
    }, "gameplay"];
  }

  override onUpdate(dt: number): boolean {
    if (!this.graphics || !this.input) return false;

    if (this.input.isPressed('KeyT')) return false;

    entities.update();

    this.graphics.clear();

    if (this.input.isHeld('MouseMain')) {
      const del = this.input.isHeld('ControlLeft');
      const [mx, my] = display.getMousePos();
      if (del) {
        this.remove(mx, my);
      } else {
        const x = (Math.floor(mx / 16) * 16) + 8;
        const y = (Math.floor(my / 16) * 16) + 8;
        const key = x + "." + y;
        const prev = this.grid[key];
        if (!prev) {
          this.add([
            EntityTypeMapping.block,
            x, y
          ]);
        }
      }
    }

    // Level edit mode
    mouseCamMove(dt, display, this.input, this);

    // Render
    culling(display);
    debugRender(this.graphics);
    renderSmb1Mario(dt);
    marioSmb1Sounds();

    return true;
  }
}