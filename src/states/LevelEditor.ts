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

  toolsCont: HTMLDivElement;
  entityCount: HTMLDivElement;
  marioSelect: HTMLButtonElement;
  exteriorFloorSelect: HTMLButtonElement;
  tileSelectors: HTMLDivElement;
  prevSelected: EntityTypeMapping | null = null;
  selected: EntityTypeMapping | null = null;

  constructor() {
    super();

    const entCountDisplay = document.createElement('div');
    this.entityCount = document.createElement('div');
    entCountDisplay.style.display = "flex";
    entCountDisplay.style.alignItems = 'center';
    const label = document.createElement('div');
    label.innerHTML = "Entities:";
    entCountDisplay.append(label, this.entityCount);

    this.tileSelectors = document.createElement('div');
    this.tileSelectors.style.padding = '20px';
    this.tileSelectors.style.display = 'flex';
    this.tileSelectors.style.flexWrap = 'wrap';
    this.tileSelectors.style.gap = '10px';

    this.marioSelect = document.createElement('button');
    this.marioSelect.innerHTML = "mario";
    this.marioSelect.onclick = () => this.selected = EntityTypeMapping.mario;

    this.exteriorFloorSelect = document.createElement('button');
    this.exteriorFloorSelect.innerHTML = "Exterior floor";
    this.exteriorFloorSelect.onclick = () => this.selected = EntityTypeMapping.block;

    this.tileSelectors.append(this.marioSelect, this.exteriorFloorSelect);

    this.toolsCont = document.createElement('div');
    this.toolsCont.style.backgroundColor = 'white';
    this.toolsCont.style.display = 'flex';
    this.toolsCont.append(entCountDisplay, this.tileSelectors);
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

    // Create tools
    const tools = document.getElementById('tools');
    const cont = document.createElement('div');
    tools?.append(cont);
    cont.style.backgroundColor = 'white';
    cont.style.display = 'flex';
    cont.append(this.toolsCont);
  }

  override onEnd(): [output: LevelEditorInit | null, next: 'gameplay'] {
    // Remove tools
    const tools = document.getElementById('tools');
    if (tools) tools.innerHTML = '';

    this.levelDataInit = JSON.stringify({entities: Object.values(this.grid).map(v => v.init)});

    if (!this.graphics || !this.input) return [null, 'gameplay'];
    const graphics = this.graphics;
    const input = this.input;
    return [{
      graphics,
      input
    }, "gameplay"];
  }

  override onUpdate(dt: number): boolean {
    if (this.selected !== this.prevSelected) {
      this.prevSelected = this.selected;
      for (const s of this.tileSelectors.children) {
        s.classList.remove('selected');
      }
      switch (this.selected) {
        case EntityTypeMapping.mario: {
          this.marioSelect.classList.add('selected');
          break;
        }
        case EntityTypeMapping.block: {
          this.exteriorFloorSelect.classList.add('selected');
          break;
        }
      }
    }

    if (!this.graphics || !this.input) return false;

    if (this.input.isPressed('Space')) return false;

    entities.update();
    this.entityCount.innerHTML = entities.number().toString();

    this.graphics.clear();

    if (this.input.isHeld('MouseMain')) {
      const del = this.input.isHeld('ControlLeft');
      const [mx, my] = display.getMousePos();
      if (del) {
        this.remove(mx, my);
      } else {
        const x = (Math.floor(mx / 16) * 16);
        const y = (Math.floor(my / 16) * 16);
        const key = x + "." + y;
        const prev = this.grid[key];
        if (!prev && this.selected) {
          this.add([
            this.selected,
            x + 8, y + 8
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