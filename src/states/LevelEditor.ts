import { Graphics } from "pixi.js";
import State from "../engine/state-machine";
import display from "../display";
import { Input, Vec2d, aabb } from "../engine";
import mouseCamMove from "../systems/mouseCamMove";
import debugRender from "../systems/debugRender";
import renderSmb1Mario from "../systems/renderSmb1Mario";
import marioSmb1Sounds from "../systems/marioSmb1Sounds";
import entities, { Entity } from "../entities";
import parseLevel from "../systems/parseLevel";
import { EntityTypeMapping, LevelData, LineSeg, OscillationInit, PlatformConnection, Points, Vine } from "../types";
import culling from "../systems/culling";
import renderSmb1Stuff from "../systems/renderSmb1Stuff";
import smb1marioFactory from "../sprites/loaders/smb1/mario";
import smb1tilesFactory, { Smb1TilesSprites } from "../sprites/loaders/smb1/tiles";
import level from '../assets/level.json';
import renderEdit from "../systems/renderEdit";
import smb1objectsFactory, { Smb1ObjectsSprites } from "../sprites/loaders/smb1/objects";

export type LevelEditorInit = {
  graphics: Graphics;
  input: Input;
  levelDataInit?: string;
}
export type LevelEditorOut = {
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

type HistoryStep = {type: 'add' | 'remove', ents: LevelData['entities'][number][], layer: 1 | 2};
type Zone = {x: number; y: number; w: number; h: number;};

export default class LevelEditor extends State<'gameplay', LevelEditorInit | null, LevelEditorOut | null> {
  graphics?: Graphics;
  input?: Input;
  levelDataInit?: string;

  zones: {
    camZones: Zone[];
    camPreserveZones: Zone[];
    deathZones: Zone[];
    underwaterZones: Zone[];
    whirlpoolZones: Zone[];
    surfaceZones: Zone[];
    noMarioInputZones: Zone[];
    descendingPlatformZones: Zone[];
  } = {
    camZones: [],
    camPreserveZones: [],
    deathZones: [],
    underwaterZones: [],
    whirlpoolZones: [],
    surfaceZones: [],
    noMarioInputZones: [],
    descendingPlatformZones: []
  };

  currentVine?: Vine;
  vines: Vine[] = [];
  vineSelected = false;

  currentPipe?: Points;
  pipes: Points[] = [];
  pipeSelected = false;

  currentTrampoline?: Vine;
  trampolines: Vine[] = [];
  trampolineSelected = false;

  platformRouteIndex: 'oscillation' | 'route' | 'connection' = 'oscillation';

  currentOscillation?: OscillationInit;
  oscillations: OscillationInit[] = [];
  oscillationSelected = false;

  currentPlatformRoute?: LineSeg;
  platformRoutes: LineSeg[] = [];
  platformRouteSelected = false;

  currentPlatformConnection?: PlatformConnection;
  platformConnections: PlatformConnection[] = [];
  platformConnectionSelected = false;

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
  platformRouteSelect: HTMLButtonElement;
  vineSelect: HTMLButtonElement;
  trampolineSelect: HTMLButtonElement;
  pipeSelect: HTMLButtonElement;
  zoneSelect: HTMLButtonElement;
  marioSelect: HTMLButtonElement;
  solidSelect: HTMLButtonElement;
  brickSelect: HTMLButtonElement;
  blockSelect: HTMLButtonElement;
  coinSelect: HTMLButtonElement;
  platformSelect: HTMLButtonElement;
  clutterSelect: HTMLButtonElement;
  tileSelectors: HTMLDivElement;
  prevSelected: EntityTypeMapping | null = null;
  selected: EntityTypeMapping | null = null;
  selectedZone: 'cam' | 'campreserve' | 'death' | 'underwater' | 'whirlpool' | 'surface' | 'noMInput' | 'descPlatform' = 'cam';
  zoneSelected: boolean = false;
  currentZone?: {x: number; y: number; w: number; h: number;};
  solidFrame?: Smb1TilesSprites['frame'] = undefined;
  brickFrame?: Smb1TilesSprites['frame'] = undefined;
  blockFrame?: Smb1TilesSprites['frame'] = undefined;
  clutterFrame?: Smb1TilesSprites['frame'] = undefined;
  platformFrame?: Smb1ObjectsSprites['frame'] = undefined;
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
    if (e.smb1ObjectsSprites) {
      e.smb1ObjectsSprites.container.alpha = alpha;
    }
    if (e.smb1ObjectsAnimations) {
      e.smb1ObjectsAnimations.container.alpha = alpha;
    }
    if (e.smb1TilesAnimations) {
      e.smb1TilesAnimations.container.alpha = alpha;
    }
    if (e.smb1TilesSpritesEditMode) {
      e.smb1TilesSpritesEditMode.container.alpha = alpha;
    }
  }

  private toggleTransparency(type: 'layer' | 'none') {
    if (type === 'none') {
      entities.view().forEach(e => this.applyAlphaFromLayer(e, this.layer));
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
      const text = document.createElement('div');
      text.innerHTML = img.alt;
      this.marioSelect.append(img, text);

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
      const text = document.createElement('div');
      text.innerHTML = img.alt;
      this.solidSelect.append(img, text);

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
      const text = document.createElement('div');
      text.innerHTML = img.alt;
      this.brickSelect.append(img, text);

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
    this.clutterFrame = 'clutterFence';
    clutter.setFrame(this.clutterFrame);
    clutter?.whenReady().then(() => {
      this.clutterSelect.innerHTML = '';
      const img = document.createElement('img');
      img.style.width = "48px";
      img.style.height = '48px';
      img.alt = 'clutter';
      const text = document.createElement('div');
      text.innerHTML = img.alt;
      this.clutterSelect.append(img, text);

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
      const text = document.createElement('div');
      text.innerHTML = img.alt;
      this.blockSelect.append(img, text);

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

    this.coinSelect = document.createElement('button');
    this.coinSelect.innerHTML = "coin";
    this.coinSelect.onclick = () => this.selected = EntityTypeMapping.coin;

    const coins = smb1tilesFactory.new();
    coins.setFrame('coin1');
    coins?.whenReady().then(() => {
      this.coinSelect.innerHTML = '';
      const img = document.createElement('img');
      img.style.width = "48px";
      img.style.height = '48px';
      img.alt = 'coin';
      const text = document.createElement('div');
      text.innerHTML = img.alt;
      this.coinSelect.append(img, text);

      const dURL = coins.getDataUrl();
      if (!dURL) return;
      img.src = dURL;
    });

    this.platformSelect = document.createElement('button');
    this.platformSelect.innerHTML = "platforms";
    this.platformSelect.onclick = () => this.selected = EntityTypeMapping.platform;

    const platforms = smb1objectsFactory.new();
    this.platformFrame = 'platformBig';
    platforms.setFrame(this.platformFrame);
    platforms?.whenReady().then(() => {
      this.platformSelect.innerHTML = '';
      const img = document.createElement('img');
      img.style.width = "48px";
      img.style.height = '48px';
      img.alt = 'platform';
      const text = document.createElement('div');
      text.innerHTML = this.platformFrame ?? img.alt;
      this.platformSelect.append(img, text);

      const dURL = platforms.getDataUrl();
      if (!dURL) return;
      img.src = dURL;

      this.platformSelect.addEventListener('wheel', e => {
        const frames = platforms.getFrames();
        let i = frames.findIndex(f => f === platforms.getFrame());
        let valid: boolean | undefined = false;
        while (valid === false) {
          i = (i + Math.sign(e.deltaY)) % frames.length;
          this.platformFrame = frames.at(i);
          valid = this.platformFrame?.includes('platform') || this.platformFrame?.includes('cloud');
        }
        if (this.platformFrame) {
          platforms.setFrame(this.platformFrame);
        }

        const dURL = platforms.getDataUrl();
        if (!dURL) return;
        img.src = dURL;
      });
    });

    this.zoneSelect = document.createElement('button');
    this.zoneSelect.innerHTML = 'camera<br>zone';
    this.zoneSelect.onclick = () => {
      this.selected = null;
      this.pipeSelected = false;
      this.vineSelected = false;
      this.zoneSelected = true;
      this.trampolineSelected = false;

      this.platformRouteSelected = false;
      this.platformConnectionSelected = false;
      this.oscillationSelected = false;
    };
    const renderZSName = () => {
      switch (this.selectedZone) {
        case 'cam':
          this.zoneSelect.innerHTML = 'camera<br>zone';
          break;
        case 'campreserve':
          this.zoneSelect.innerHTML = 'camera preserve<br>zone';
          break;
        case 'noMInput':
          this.zoneSelect.innerHTML = 'no mario input<br>zone';
          break;
        case 'underwater':
          this.zoneSelect.innerHTML = 'underwater<br>zone';
          break;
        case 'surface':
          this.zoneSelect.innerHTML = 'surface<br>zone';
          break;
        case 'whirlpool':
          this.zoneSelect.innerHTML = 'whirlpool<br>zone';
          break;
        case 'descPlatform':
          this.zoneSelect.innerHTML = 'desc. platform<br>zone';
          break;
        default:
          this.zoneSelect.innerHTML = 'death<br>zone';
          break;
      }
    };
    renderZSName();
    this.zoneSelect.addEventListener('wheel', e => {
      if (Math.sign(e.deltaY) > 0) {
        switch (this.selectedZone) {
          case 'cam':
            this.selectedZone = 'campreserve';
            break;
          case 'campreserve':
            this.selectedZone = 'noMInput';
            break;
          case 'noMInput':
            this.selectedZone = 'underwater';
            break;
          case 'underwater':
            this.selectedZone = 'surface';
            break;
          case 'surface':
            this.selectedZone = 'whirlpool';
            break;
          case 'whirlpool':
            this.selectedZone = 'death';
            break;
          case 'death':
            this.selectedZone = 'descPlatform';
            break;
          default:
            this.selectedZone = 'cam';
            break;
        }
      } else {
        switch (this.selectedZone) {
          case 'cam':
            this.selectedZone = 'descPlatform';
            break;
          case 'campreserve':
            this.selectedZone = 'cam';
            break;
          case 'noMInput':
            this.selectedZone = 'campreserve';
            break;
          case 'underwater':
            this.selectedZone = 'noMInput';
            break;
          case 'surface':
            this.selectedZone = 'underwater';
            break;
          case 'whirlpool':
            this.selectedZone = 'surface';
            break;
          case 'death':
            this.selectedZone = 'whirlpool';
            break;
          default:
            this.selectedZone = 'death';
            break;
        }
      }
      renderZSName();
    });

    this.pipeSelect = document.createElement('button');
    this.pipeSelect.innerHTML = 'pipe<br>path';
    this.pipeSelect.onclick = () => {
      this.selected = null;
      this.zoneSelected = false;
      this.vineSelected = false;
      this.pipeSelected = true;
      this.trampolineSelected = false;

      this.platformRouteSelected = false;
      this.platformConnectionSelected = false;
      this.oscillationSelected = false;
    };

    this.vineSelect = document.createElement('button');
    this.vineSelect.innerHTML = 'vine<br>marker';
    this.vineSelect.onclick = () => {
      this.selected = null;
      this.zoneSelected = false;
      this.pipeSelected = false;
      this.vineSelected = true;
      this.trampolineSelected = false;

      this.platformRouteSelected = false;
      this.platformConnectionSelected = false;
      this.oscillationSelected = false;
    };

    this.trampolineSelect = document.createElement('button');
    this.trampolineSelect.innerHTML = 'trampoline';
    this.trampolineSelect.onclick = () => {
      this.selected = null;
      this.zoneSelected = false;
      this.pipeSelected = false;
      this.vineSelected = false;
      this.trampolineSelected = true;

      this.platformRouteSelected = false;
      this.platformConnectionSelected = false;
      this.oscillationSelected = false;
    };

    this.platformRouteSelect = document.createElement('button');
    const renderPRName = () => {
      if (this.platformRouteIndex === 'connection') {
        this.platformRouteSelect.innerHTML = 'platform<br>connection';
      } else if (this.platformRouteIndex === 'oscillation') {
        this.platformRouteSelect.innerHTML = 'platform<br>oscillation';
      } else {
        this.platformRouteSelect.innerHTML = 'platform<br>route';
      }
    };
    renderPRName();
    const selectPR = () => {
      this.selected = null;
      this.zoneSelected = false;
      this.vineSelected = false;
      this.pipeSelected = false;
      this.trampolineSelected = false;

      this.platformRouteSelected = false;
      this.platformConnectionSelected = false;
      this.oscillationSelected = false;
      if (this.platformRouteIndex === 'connection') {
        this.platformConnectionSelected = true;
      } else if (this.platformRouteIndex === 'oscillation') {
        this.oscillationSelected = true;
      } else {
        this.platformRouteSelected = true;
      }
    };
    this.platformRouteSelect.onclick = selectPR;
    this.platformRouteSelect.addEventListener('wheel', e => {
      if (Math.sign(e.deltaY) > 0) {
        switch (this.platformRouteIndex) {
          case 'oscillation':
            this.platformRouteIndex = 'route';
            break;
          case 'route':
            this.platformRouteIndex = 'connection';
            break;
          default:
            this.platformRouteIndex = 'oscillation';
            break;
        }
      } else {
        switch (this.platformRouteIndex) {
          case 'oscillation':
            this.platformRouteIndex = 'connection';
            break;
          case 'connection':
            this.platformRouteIndex = 'route';
            break;
          default:
            this.platformRouteIndex = 'oscillation';
            break;
        }
      }
      renderPRName();
      if (this.platformRouteSelected || this.platformConnectionSelected || this.oscillationSelected) selectPR();
    });

    this.tileSelectors.append(this.zoneSelect, this.pipeSelect, this.vineSelect, this.trampolineSelect, this.platformRouteSelect, this.marioSelect, this.solidSelect, this.brickSelect, this.blockSelect, this.coinSelect, this.platformSelect, this.clutterSelect);

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
          const ld: LevelData = {
            entities: [],
            entities2: [],
            ...this.zones,
            pipes: this.pipes,
            vines: this.vines,
            trampolines: this.trampolines,
            oscillations: this.oscillations,
            platformRoutes: this.platformRoutes,
            platformConnections: this.platformConnections
          };
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

  override onEnd(): [output: LevelEditorOut | null, next: 'gameplay'] {
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
      entities2: Object.values(this.grid2).map(v => v.init),
      ...this.zones
    });

    if (!this.graphics || !this.input) return [null, 'gameplay'];
    const graphics = this.graphics;
    const input = this.input;
    return [{
      graphics,
      input,
      zones: this.zones,
      pipes: this.pipes,
      vines: this.vines,
      trampolines: this.trampolines,
      oscillations: this.oscillations,
      platformRoutes: this.platformRoutes,
      platformConnections: this.platformConnections
    }, "gameplay"];
  }

  override onUpdate(dt: number): boolean {
    this.graphicsOverlay.clear();

    if (this.selected) {
      this.zoneSelected = false;
      this.pipeSelected = false;
      this.vineSelected = false;
      this.trampolineSelected = false;

      this.platformRouteSelected = false;
      this.platformConnectionSelected = false;
      this.oscillationSelected = false;

      this.currentZone = undefined;
      this.currentPipe = undefined;
      this.currentVine = undefined;
      this.currentTrampoline = undefined;
      this.currentOscillation = undefined;
      this.currentPlatformConnection = undefined;
      this.currentPlatformRoute = undefined;
    }

    if (this.zoneSelected) {
      this.zoneSelect.classList.add('selected');
    } else {
      this.zoneSelect.classList.remove('selected');
    }

    if (this.pipeSelected) {
      this.pipeSelect.classList.add('selected');
    } else {
      this.pipeSelect.classList.remove('selected');
    }

    if (this.vineSelected) {
      this.vineSelect.classList.add('selected');
    } else {
      this.vineSelect.classList.remove('selected');
    }

    if (this.trampolineSelected) {
      this.trampolineSelect.classList.add('selected');
    } else {
      this.trampolineSelect.classList.remove('selected');
    }

    if (this.platformRouteSelected || this.platformConnectionSelected || this.oscillationSelected) {
      this.platformRouteSelect.classList.add('selected');
    } else {
      this.platformRouteSelect.classList.remove('selected');
    }

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
        case EntityTypeMapping.coin: {
          this.coinSelect.classList.add('selected');
          break;
        }
        case EntityTypeMapping.platform: {
          this.platformSelect.classList.add('selected');
          break;
        }
      }
    }

    if (!this.graphics || !this.input) return false;

    if (this.input.isPressed('Space')) return false;

    // Traverse history
    if (this.input.isPressed('KeyZ') && (this.input.isHeld('ControlLeft') || this.input.isHeld('ControlRight'))) {
      if (this.input.isHeld("ShiftLeft") || this.input.isHeld("ShiftRight")) {
        // Restore
        if (this.selected) {
          this.historyRestore();
        } else if (this.currentVine) {
          this.currentVine = undefined;
        }
      } else {
        // Undo
        if (this.selected) {
          this.historyUndo();
        } else if (this.pipeSelected) {
          if (this.currentPipe) {
            this.currentPipe.pop();
            if (this.currentPipe.length <= 1) {
              this.currentPipe = undefined;
            }
          } else {
            this.pipes.pop();
          }
        } else if (this.vineSelected) {
          this.vines.pop();
        } else if (this.trampolineSelect) {
          this.trampolines.pop();
        }
      }
    }

    const [mx, my] = display.getMousePos();
    const mxgrid = Math.floor(mx / 16) * 16;
    const mygrid = Math.floor(my / 16) * 16;
    this.mousePosDisplay.innerHTML = `x: ${Math.floor(mx)} | y: ${Math.floor(my)}<br>gx: ${mxgrid} | gy: ${mygrid}`;

    entities.update();
    this.entityCount.innerHTML = entities.number().toString();

    this.graphics.clear();

    if (this.input.isHeld('MouseMain')) {
      const del = this.input.isHeld('ControlLeft');
      if (del && this.selected) {
        const r = this.remove(mx, my);
        if (r) {
          this.historyPush({type: "remove", ents: [r.init], layer: this.layer});
        }
      } else {
        const x = mxgrid;
        const y = mygrid;
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
            case EntityTypeMapping.coin: {
              h = this.add([
                this.selected,
                xstart, ystart
              ]);
              break;
            }
            case EntityTypeMapping.platform: {
              h = this.add([
                this.selected,
                xstart, ystart,
                {objectFrame: this.platformFrame}
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

    if (this.zoneSelected) {
      const snapToGrid = !this.input.isHeld('ShiftLeft');
      const del = this.input.isHeld('ControlLeft');
      const x = snapToGrid ? mxgrid : mx;
      const y = snapToGrid ? mygrid : my;

      if (this.input.isPressed('MouseMain')) {
        if (del) {
          this.currentZone = undefined;

          const z = Object.entries(this.zones).flatMap(z => {
            return z[1].map(zone => ({type: z[0], zone}));
          })
          .sort((a, b) => a.zone.w * a.zone.h - b.zone.w * b.zone.h) // smallest first
          .find(z => aabb.pointVsRect(new Vec2d(mx, my), {pos: new Vec2d(z.zone.x, z.zone.y), size: new Vec2d(z.zone.w, z.zone.h)}));

          if (z) {
            const set = new Set((this.zones as any)[z.type]);
            set.delete(z.zone);
            (this.zones as any)[z.type] = [...set];
          }
        } else {
          this.currentZone = {x, y, w: 16, h: 16};
        }
      }

      if (this.input.isHeld('MouseMain')) {
        if (this.currentZone) {
          const xSide = Math.sign(x + 8 - this.currentZone.x);
          if (snapToGrid) {
            this.currentZone.w = x + 16 - this.currentZone.x;
            if (xSide < 0) {
              this.currentZone.w = this.currentZone.w - 16;
            }
          } else {
            const w = x - this.currentZone.x;
            this.currentZone.w = Math.abs(w) > 16 ? w : Math.sign(w) * 16 || 16;
          }

          const ySide = Math.sign(y + 8 - this.currentZone.y);
          if (snapToGrid) {
            this.currentZone.h = y + 16 - this.currentZone.y;
            if (ySide < 0) {
              this.currentZone.h = this.currentZone.h - 16;
            }
          } else {
            const h = y - this.currentZone.y;
            this.currentZone.h = Math.abs(h) > 16 ? h : Math.sign(h) * 16 || 16;
          }
        }
      }

      if (this.input.isReleased('MouseMain')) {
        if (this.currentZone) {
          let x = 0, y = 0, w = 0, h = 0;
          if (this.currentZone.w > 0) {
            x = this.currentZone.x;
            w = this.currentZone.w;
          } else {
            x = this.currentZone.x + this.currentZone.w;
            w = -this.currentZone.w;
          }
          if (this.currentZone.h > 0) {
            y = this.currentZone.y;
            h = this.currentZone.h;
          } else {
            y = this.currentZone.y + this.currentZone.h;
            h = -this.currentZone.h;
          }
          switch (this.selectedZone) {
            case 'cam':
              this.zones.camZones.push({x,y,w,h});
              break;
            case 'campreserve':
              this.zones.camPreserveZones.push({x,y,w,h});
              break;
            case 'death':
              this.zones.deathZones.push({x,y,w,h});
              break;
            case 'noMInput':
              this.zones.noMarioInputZones.push({x,y,w,h});
              break;
            case 'surface':
              this.zones.surfaceZones.push({x,y,w,h});
              break;
            case 'underwater':
              this.zones.underwaterZones.push({x,y,w,h});
              break;
            case 'whirlpool':
              this.zones.whirlpoolZones.push({x,y,w,h});
              break;
            case 'descPlatform':
              this.zones.descendingPlatformZones.push({x,y,w,h});
              break;
          }
          this.currentZone = undefined;
        }
      }
    }

    if (this.pipeSelected) {
      if (this.input.isPressed('Delete') || this.input.isPressed('Backspace')) {
        this.currentPipe = undefined;
      }

      if (this.input.isPressed('MouseMain')) {
        const del = this.input.isHeld('ControlLeft');

        if (del) {
          const pipe = this.pipes.find(p => p.find(point => point[0] === mxgrid && point[1] === mygrid));
          if (pipe) {
            const set = new Set(this.pipes);
            set.delete(pipe);
            this.pipes = [...set];
          }
        } else {
          if (this.currentPipe) {
            const last = this.currentPipe.at(-1);
            if (last && last[0] === mxgrid && last[1] === mygrid) {
              this.pipes.push(this.currentPipe);
              this.currentPipe = undefined;
            } else {
              this.currentPipe.push([mxgrid, mygrid]);
            }
          } else {
            this.currentPipe = [[mxgrid, mygrid]];
          }
        }
      }

      if (this.input.isPressed("Enter") && this.currentPipe) {
        this.pipes.push(this.currentPipe);
        this.currentPipe = undefined;
      }
    }

    if (this.vineSelected) {
      if (this.input.isPressed('Delete') || this.input.isPressed('Backspace')) {
        this.currentVine = undefined;
      }

      if (this.input.isPressed('MouseMain')) {
        const del = this.input.isHeld('ControlLeft');

        if (del) {
          const vine = this.vines.find(v => Math.abs(v.x - mxgrid) < 16 && Math.abs(v.y - mygrid) < 16);
          if (vine) {
            const set = new Set(this.vines);
            set.delete(vine);
            this.vines = [...set];
          }
        } else {
          if (this.currentVine) {
            this.vines.push(this.currentVine);
            this.currentVine = undefined;
          } else {
            this.currentVine = {x: mxgrid + 8, y: mygrid + 8, h: 0};
          }
        }
      }

      if (this.currentVine) {
        this.currentVine.h = Math.abs(mygrid - this.currentVine.y);
      }
    }

    if (this.trampolineSelected) {
      if (this.input.isPressed('Delete') || this.input.isPressed('Backspace')) {
        this.currentTrampoline = undefined;
      }

      if (this.input.isPressed('MouseMain')) {
        const del = this.input.isHeld('ControlLeft');

        if (del) {
          const trampoline = this.trampolines.find(t => Math.abs(t.x - mxgrid) < 16 && Math.abs(t.y - mygrid) < 16);
          if (trampoline) {
            const set = new Set(this.trampolines);
            set.delete(trampoline);
            this.trampolines = [...set];
          }
        } else {
          if (this.currentTrampoline) {
            this.trampolines.push(this.currentTrampoline);
            this.currentTrampoline = undefined;
          } else {
            this.currentTrampoline = {x: mxgrid + 8, y: mygrid + 8, h: 0};
          }
        }
      }

      if (this.currentTrampoline) {
        this.currentTrampoline.h = Math.abs(mygrid - this.currentTrampoline.y);
      }
    }

    if (this.oscillationSelected) {
      if (this.input.isPressed('Delete') || this.input.isPressed('Backspace')) {
        this.currentOscillation = undefined;
      }

      if (this.input.isPressed('MouseMain')) {
        const del = this.input.isHeld('ControlLeft');

        if (del) {
          const osc = this.oscillations.find(o => (
            Math.abs(o.p1.x - mxgrid) < 16 && Math.abs(o.p1.y - mygrid) < 16
          ) || (
            Math.abs(o.p2.x - mxgrid) < 16 && Math.abs(o.p2.y - mygrid) < 16
          ) || (
            Math.abs(o.pstart.x - mxgrid) < 16 && Math.abs(o.pstart.y - mygrid) < 16
          ));
          if (osc) {
            const set = new Set(this.oscillations);
            set.delete(osc);
            this.oscillations = [...set];
          }
        } else {
          if (this.currentOscillation) {
            if (this.currentOscillation.setting === 'p1') {
              this.currentOscillation.setting = 'p2';
            } else {
              this.oscillations.push(this.currentOscillation);
              this.currentOscillation = undefined;
            }
          } else {
            this.currentOscillation = {
              pstart: new Vec2d(mxgrid + 8, mygrid + 8),
              p1: new Vec2d(mxgrid + 8, mygrid + 8),
              p2: new Vec2d(mxgrid + 8, mygrid + 8),
              setting: 'p1'
            };
          }
        }
      }

      if (this.currentOscillation) {
        if (this.currentOscillation.setting === 'p1') {
          this.currentOscillation.p1.x = mxgrid + 8;
          this.currentOscillation.p1.y = mygrid + 8;
        } else if (this.currentOscillation.setting === 'p2') {
          this.currentOscillation.p2.x = mxgrid + 8;
          this.currentOscillation.p2.y = mygrid + 8;
        }
      }
    }

    if (this.platformRouteSelected) {
      if (this.input.isPressed('Delete') || this.input.isPressed('Backspace')) {
        this.currentPlatformRoute = undefined;
      }

      if (this.input.isPressed('MouseMain')) {
        const del = this.input.isHeld('ControlLeft');

        if (del) {
          const osc = this.platformRoutes.find(o => (
            Math.abs(o.p1.x - mxgrid) < 16 && Math.abs(o.p1.y - mygrid) < 16
          ) || (
            Math.abs(o.p2.x - mxgrid) < 16 && Math.abs(o.p2.y - mygrid) < 16
          ));
          if (osc) {
            const set = new Set(this.platformRoutes);
            set.delete(osc);
            this.platformRoutes = [...set];
          }
        } else {
          if (this.currentPlatformRoute) {
            this.platformRoutes.push(this.currentPlatformRoute);
            this.currentPlatformRoute = undefined;
          } else {
            this.currentPlatformRoute = {
              p1: new Vec2d(mxgrid + 8, mygrid + 8),
              p2: new Vec2d(mxgrid + 8, mygrid + 8)
            };
          }
        }
      }

      if (this.currentPlatformRoute) {
        this.currentPlatformRoute.p2.x = mxgrid + 8;
        this.currentPlatformRoute.p2.y = mygrid + 8;
      }
    }

    // Level edit mode
    mouseCamMove(dt, display, this.input, this);

    // Render
    culling(display);
    debugRender(this.graphics);
    renderSmb1Mario(dt);
    renderSmb1Stuff(dt, true);
    renderEdit(
      this.graphics,
      this.graphicsOverlay,
      this.zones,
      this.pipes,
      this.vines,
      this.trampolines,
      this.oscillations,
      this.platformRoutes,
      this.currentZone,
      this.currentPipe,
      this.currentVine,
      this.currentTrampoline,
      this.currentOscillation,
      this.currentPlatformRoute
    );
    marioSmb1Sounds();

    return true;
  }
}