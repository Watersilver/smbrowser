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
import renderSmb1Tiles from "../systems/renderSmb1Tiles";
import smb1marioFactory from "../sprites/loaders/smb1/mario";
import smb1tilesFactory, { Smb1TilesSprites } from "../sprites/loaders/smb1/tiles";
import level from '../assets/level.json';
import renderEdit from "../systems/renderEdit";

// TODO: Camera clamper polygon

// TODO: Maek game

export type LevelEditorInit = {
  graphics: Graphics;
  input: Input;
  levelDataInit?: string;
}

type HistoryStep = {type: 'add' | 'remove', ents: LevelData['entities'][number][], layer: 1 | 2};

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
  grid2: {
    [position: string]: {
      gameObj: Entity;
      init: [type: EntityTypeMapping, x: number, y: number, init?: {}, custom?: Entity];
    };
  } = {};

  scale = 1;

  getGrid(layer?: 1 | 2) {
    const l = layer ?? this.layer;
    return l === 2 ? this.grid2 : this.grid;
  }

  remove(x: number, y: number, ent?: Entity, layer?: 1 | 2) {
    const g = this.getGrid(layer);
    const key = (Math.floor(x / 16) * 16) + "." + (Math.floor(y / 16) * 16);
    const e = g[key];
    if (!e) return;
    if (ent) if (ent !== e.gameObj) return;
    delete g[key];
    if (e?.gameObj) entities.remove(e.gameObj);
    return e;
  }

  add(...ents: LevelData['entities'][number][]) {
    const {grid} = parseLevel({entities: ents, entities2: []});
    const g = this.getGrid();
    const h: {entObs: Entity[], ents: LevelData['entities'][number][], layer: 1 | 2} = {layer: this.layer, entObs: [], ents};
    for (const [pos, e] of Object.entries(grid)) {
      const prev = g[pos];
      delete g[pos];
      if (prev?.gameObj) entities.remove(prev.gameObj);
      g[pos] = e;

      this.applyAlphaFromLayer(e.gameObj, g === this.grid ? 1 : 2);

      h.entObs.push(e.gameObj);
    }
    return h;
  }

  toolsCont: HTMLDivElement;
  entityCount: HTMLDivElement;
  mousePosDisplay: HTMLDivElement;
  marioSelect: HTMLButtonElement;
  solidSelect: HTMLButtonElement;
  brickSelect: HTMLButtonElement;
  blockSelect: HTMLButtonElement;
  clutterSelect: HTMLButtonElement;
  tileSelectors: HTMLDivElement;
  prevSelected: EntityTypeMapping | null = null;
  selected: EntityTypeMapping | null = null;
  solidFrame?: Smb1TilesSprites['frame'] = undefined;
  brickFrame?: Smb1TilesSprites['frame'] = undefined;
  blockFrame?: Smb1TilesSprites['frame'] = undefined;
  clutterFrame?: Smb1TilesSprites['frame'] = undefined;
  layer: 1 | 2 = 1;
  history: HistoryStep[] = [];
  historyIndex = 0;

  historyPush(h: HistoryStep) {
    this.history.length = this.historyIndex;
    this.history.push(h);
    if (this.history.length > 25) {
      this.history.shift();
    }
    this.historyIndex = this.history.length;
  }

  historyUndo() {
    const hiprev = this.historyIndex;
    this.historyIndex = this.historyIndex - 1;
    if (this.historyIndex < 0) this.historyIndex = 0;
    if (hiprev === this.historyIndex) return;

    const h = this.history[this.historyIndex];

    if (h) {
      const lprev = this.layer;
      this.layer = h.layer;
      if (h.type === 'add') {
        h.ents.forEach(e => {
          this.remove(e[1], e[2]);
        });
      } else {
        this.add(...h.ents);
      }
      this.layer = lprev;
    }
  }

  historyRestore() {
    if (this.history.length <= this.historyIndex) return;
    const h = this.history[this.historyIndex];
    if (!h) return;
    this.historyIndex += 1;

    const lprev = this.layer;
    this.layer = h.layer;
    if (h.type === 'add') {
      this.add(...h.ents);
    } else {
      h.ents.forEach(e => {
        this.remove(e[1], e[2]);
      });
    }
    this.layer = lprev;
  }

  toggleLayer() {
    this.layer = this.layer === 1 ? 2 : 1;
  }

  private applyAlphaFromLayer(e: Entity, layer: 1 | 2) {
    const alpha = this.layer === layer ? 1 : 0.5;

    if (e.smb1MarioAnimations) {
      e.smb1MarioAnimations.container.alpha = alpha;
    }
    if (e.smb1TilesSprites) {
      e.smb1TilesSprites.container.alpha = alpha;
    }
  }

  private toggleTransparency(type: 'layer' | 'none') {
    if (type === 'none') {
      entities.view(['smb1MarioAnimations']).forEach(m => {
        if (m.smb1MarioAnimations) m.smb1MarioAnimations.container.alpha = 1;
      });
      entities.view(['smb1TilesSprites']).forEach(m => {
        if (m.smb1TilesSprites) m.smb1TilesSprites.container.alpha = 1;
      });
    } else if (type === 'layer') {
      const grid = this.getGrid();
      const otherGrid = grid === this.grid ? this.grid2 : this.grid;
      Object.values(grid).forEach(e => this.applyAlphaFromLayer(e.gameObj, grid === this.grid ? 1 : 2));
      Object.values(otherGrid).forEach(e => this.applyAlphaFromLayer(e.gameObj, otherGrid === this.grid ? 1 : 2));
    }
  }

  graphicsOverlay = new Graphics();

  constructor() {
    super();

    this.graphicsOverlay.zIndex = 100;

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

    const m = smb1marioFactory.new();
    m?.whenReady().then(() => {
      this.marioSelect.innerHTML = '';
      const img = document.createElement('img');
      img.style.width = "48px";
      img.style.height = '48px';
      img.alt = 'mario';
      this.marioSelect.append(img);

      const dURL = m.getDataUrl();
      if (!dURL) return;
      img.src = dURL;
    });

    this.solidSelect = document.createElement('button');
    this.solidSelect.innerHTML = "solid";
    this.solidSelect.onclick = () => this.selected = EntityTypeMapping.block;

    const t = smb1tilesFactory.new();
    t?.whenReady().then(() => {
      this.solidSelect.innerHTML = '';
      const img = document.createElement('img');
      img.style.width = "48px";
      img.style.height = '48px';
      img.alt = 'solid';
      this.solidSelect.append(img);

      const dURL = t.getDataUrl();
      if (!dURL) return;
      img.src = dURL;

      this.solidSelect.addEventListener('wheel', e => {
        const frames = t.getFrames();
        let i = frames.findIndex(f => f === t.getFrame());
        let isSolid: boolean | undefined = false;
        while (isSolid === false) {
          i = (i + Math.sign(e.deltaY)) % frames.length;
          this.solidFrame = frames.at(i);
          isSolid = this.solidFrame?.includes('solid');
        }
        if (this.solidFrame) {
          t.setFrame(this.solidFrame);
        }

        const dURL = t.getDataUrl();
        if (!dURL) return;
        img.src = dURL;
      });
    });

    this.brickSelect = document.createElement('button');
    this.brickSelect.innerHTML = "brick";
    this.brickSelect.onclick = () => this.selected = EntityTypeMapping.brick;

    const bricks = smb1tilesFactory.new();
    this.brickFrame = 'brick1';
    bricks.setFrame(this.brickFrame);
    bricks?.whenReady().then(() => {
      this.brickSelect.innerHTML = '';
      const img = document.createElement('img');
      img.style.width = "48px";
      img.style.height = '48px';
      img.alt = 'brick';
      this.brickSelect.append(img);

      const dURL = bricks.getDataUrl();
      if (!dURL) return;
      img.src = dURL;

      this.brickSelect.addEventListener('wheel', e => {
        const frames = bricks.getFrames();
        let i = frames.findIndex(f => f === bricks.getFrame());
        let isBrick: boolean | undefined = false;
        while (isBrick === false) {
          i = (i + Math.sign(e.deltaY)) % frames.length;
          this.brickFrame = frames.at(i);
          isBrick = this.brickFrame?.includes('brick');
        }
        if (this.brickFrame) {
          bricks.setFrame(this.brickFrame);
        }

        const dURL = bricks.getDataUrl();
        if (!dURL) return;
        img.src = dURL;
      });
    });

    this.clutterSelect = document.createElement('button');
    this.clutterSelect.innerHTML = "clutter";
    this.clutterSelect.onclick = () => this.selected = EntityTypeMapping.clutter;

    const clutter = smb1tilesFactory.new();
    this.clutterFrame = 'clutterGreenPipeBodyHorizontalBotton';
    clutter.setFrame(this.clutterFrame);
    clutter?.whenReady().then(() => {
      this.clutterSelect.innerHTML = '';
      const img = document.createElement('img');
      img.style.width = "48px";
      img.style.height = '48px';
      img.alt = 'clutter';
      this.clutterSelect.append(img);

      const dURL = clutter.getDataUrl();
      if (!dURL) return;
      img.src = dURL;

      this.clutterSelect.addEventListener('wheel', e => {
        const frames = clutter.getFrames();
        let i = frames.findIndex(f => f === clutter.getFrame());
        let valid: boolean | undefined = false;
        while (valid === false) {
          i = (i + Math.sign(e.deltaY)) % frames.length;
          this.clutterFrame = frames.at(i);
          valid = this.clutterFrame?.includes('clutter');
        }
        if (this.clutterFrame) {
          clutter.setFrame(this.clutterFrame);
        }

        const dURL = clutter.getDataUrl();
        if (!dURL) return;
        img.src = dURL;
      });
    });

    // TODO: blocks will be animated
    this.blockSelect = document.createElement('button');
    this.blockSelect.innerHTML = "block";
    this.blockSelect.onclick = () => this.selected = EntityTypeMapping.coinblock;

    const blocks = smb1tilesFactory.new();
    this.blockFrame = 'block1';
    blocks.setFrame(this.blockFrame);
    blocks?.whenReady().then(() => {
      this.blockSelect.innerHTML = '';
      const img = document.createElement('img');
      img.style.width = "48px";
      img.style.height = '48px';
      img.alt = 'block';
      this.blockSelect.append(img);

      const dURL = blocks.getDataUrl();
      if (!dURL) return;
      img.src = dURL;

      this.blockSelect.addEventListener('wheel', e => {
        const frames = blocks.getFrames();
        let i = frames.findIndex(f => f === blocks.getFrame());
        let valid: boolean | undefined = false;
        while (valid === false) {
          i = (i + Math.sign(e.deltaY)) % frames.length;
          this.blockFrame = frames.at(i);
          valid = this.blockFrame?.includes('block');
        }
        if (this.blockFrame) {
          blocks.setFrame(this.blockFrame);
        }

        const dURL = blocks.getDataUrl();
        if (!dURL) return;
        img.src = dURL;
      });
    });

    this.tileSelectors.append(this.marioSelect, this.solidSelect, this.brickSelect, this.blockSelect, this.clutterSelect);

    this.mousePosDisplay = document.createElement('div');

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.append(this.mousePosDisplay, entCountDisplay, this.tileSelectors);

    const right = document.createElement('div');
    const layerControl = document.createElement('button');
    layerControl.innerHTML = `Layer: [${this.layer}]`;
    layerControl.onclick = () => {
      this.toggleLayer();
      this.toggleTransparency('layer');
      layerControl.innerHTML = `Layer: [${this.layer}]`;
    }
    right.append(layerControl);

    this.toolsCont = document.createElement('div');
    this.toolsCont.style.width = '100%';
    this.toolsCont.style.backgroundColor = 'white';
    this.toolsCont.style.display = 'flex';
    this.toolsCont.style.justifyContent = 'space-between';
    this.toolsCont.append(left, right);
  }

  disableSave?: () => void;
  override onStart(init: LevelEditorInit | null): void {
    if (!init) return;

    display.add(this.graphicsOverlay);

    entities.clear();
    this.scale = display.getScale();
    this.graphics = init.graphics;
    this.input = init.input;
    this.levelDataInit = init.levelDataInit || this.levelDataInit || level as any;
    if (this.levelDataInit) {
      const ld = parseLevel(this.levelDataInit);
      this.grid = ld.grid;
      this.grid2 = ld.grid2;
    }
    this.toggleTransparency('layer');

    // Create tools
    const tools = document.getElementById('tools');
    const cont = document.createElement('div');
    tools?.append(cont);
    cont.style.backgroundColor = 'white';
    cont.append(this.toolsCont);

    // Listen for save
    const saveListen = () => {
      const save = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.code === "KeyS") {
          e.preventDefault();
          const ld: LevelData = {entities: [], entities2: []};
          for (const d of Object.values(this.grid)) {
            ld.entities.push(d.init);
          }
          if (!ld.entities2) ld.entities2 = [];
          for (const d of Object.values(this.grid2)) {
            ld.entities2.push(d.init);
          }
          const f = new File([JSON.stringify(ld)], 'level.json');
          const a = window.document.createElement('a');
          a.href = window.URL.createObjectURL(f);
          a.download = 'level.json';
      
          document.body.appendChild(a)
          a.click();
          document.body.removeChild(a)
        }
      }
      document.addEventListener('keydown', save);
      return () => document.removeEventListener('keydown', save);
    }
    this.disableSave = saveListen();
  }

  override onEnd(): [output: LevelEditorInit | null, next: 'gameplay'] {
    this.toggleTransparency('none');
    // Remove graphics overlay
    this.graphicsOverlay.removeFromParent();
    // Disable save level listener
    this.disableSave?.();
    // Remove tools
    const tools = document.getElementById('tools');
    if (tools) tools.innerHTML = '';

    this.levelDataInit = JSON.stringify({
      entities: Object.values(this.grid).map(v => v.init),
      entities2: Object.values(this.grid2).map(v => v.init)
    });

    if (!this.graphics || !this.input) return [null, 'gameplay'];
    const graphics = this.graphics;
    const input = this.input;
    return [{
      graphics,
      input
    }, "gameplay"];
  }

  override onUpdate(dt: number): boolean {
    this.graphicsOverlay.clear();

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
          this.solidSelect.classList.add('selected');
          break;
        }
        case EntityTypeMapping.brick: {
          this.brickSelect.classList.add('selected');
          break;
        }
        case EntityTypeMapping.clutter: {
          this.clutterSelect.classList.add('selected');
          break;
        }
        case EntityTypeMapping.coinblock: {
          this.blockSelect.classList.add('selected');
          break;
        }
      }
    }

    if (!this.graphics || !this.input) return false;

    if (this.input.isPressed('Space')) return false;

    // Traverse history
    if (this.input.isPressed('KeyZ') && (this.input.isHeld('ControlLeft') || this.input.isHeld('ControlRight'))) {
      if (this.input.isHeld("ShiftLeft") || this.input.isHeld("ShiftRight")) {
        this.historyRestore();
      } else {
        this.historyUndo();
      }
    }

    const [mx, my] = display.getMousePos();
    this.mousePosDisplay.innerHTML = `x: ${Math.floor(mx)} | y: ${Math.floor(my)}<br>gx: ${Math.floor(mx / 16) * 16} | gy: ${Math.floor(my / 16) * 16}`;

    entities.update();
    this.entityCount.innerHTML = entities.number().toString();

    this.graphics.clear();

    if (this.input.isHeld('MouseMain')) {
      const del = this.input.isHeld('ControlLeft');
      const [mx, my] = display.getMousePos();
      if (del) {
        const r = this.remove(mx, my);
        if (r) {
          this.historyPush({type: "remove", ents: [r.init], layer: this.layer});
        }
      } else {
        const x = (Math.floor(mx / 16) * 16);
        const y = (Math.floor(my / 16) * 16);
        const key = x + "." + y;
        const prev = this.getGrid()[key];
        if (!prev && this.selected) {
          const snapToGrid = !this.input.isHeld('ShiftLeft');
          const xstart = snapToGrid ? x + 8 : mx;
          const ystart = snapToGrid ? y + 8 : my;
          let h: {
            ents: LevelData['entities'][number][],
            layer: 1 | 2;
          } | null = null;
          switch (this.selected) {
            case EntityTypeMapping.block: {
              if (this.solidFrame && this.solidFrame !== 'solidFloor1') {
                h = this.add([
                  this.selected,
                  xstart, ystart,
                  {tileFrame: this.solidFrame}
                ]);
              } else {
                h = this.add([
                  this.selected,
                  xstart, ystart
                ]);
              }
              break;
            }
            case EntityTypeMapping.brick: {
              h = this.add([
                this.selected,
                xstart, ystart,
                {tileFrame: this.brickFrame}
              ]);
              break;
            }
            case EntityTypeMapping.clutter: {
              h = this.add([
                this.selected,
                xstart, ystart,
                {tileFrame: this.clutterFrame}
              ]);
              break;
            }
            case EntityTypeMapping.coinblock: {
              h = this.add([
                this.selected,
                xstart, ystart,
                {tileFrame: this.blockFrame}
              ]);
              break;
            }
            default: {
              h = this.add([
                this.selected,
                xstart, ystart
              ]);
            }
          }
          this.historyPush({type: 'add', ...h});
        }
      }
    }

    // Level edit mode
    mouseCamMove(dt, display, this.input, this);

    // Render
    culling(display);
    debugRender(this.graphics);
    renderSmb1Mario(dt);
    renderSmb1Tiles();
    renderEdit(this.graphics, this.graphicsOverlay);
    marioSmb1Sounds();

    return true;
  }
}