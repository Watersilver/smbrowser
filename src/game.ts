import './config'
import { Graphics } from "pixi.js";
import display from "./display"
import { Input, Loop } from "./engine"
import State from "./engine/state-machine"
import { getSmb1Audio } from "./audio";
import LevelEditor, { LevelEditorInit } from './states/LevelEditor';
import Gameplay from './states/Gameplay';
import smb1marioFactory from './sprites/loaders/smb1/mario';
import smb1tilesFactory from './sprites/loaders/smb1/tiles';
import smb1objectsFactory from './sprites/loaders/smb1/objects';
import smb1tilesanimationsFactory from './sprites/loaders/smb1/animated-tiles';
import smb1enemiesanimationsFactory from './sprites/loaders/smb1/enemies';
import smb1objectsanimationsFactory from './sprites/loaders/smb1/animated-objects';

display.setBGColor('#9290FF');
display.countFps();
display.showFps();

const audio = getSmb1Audio();

class Loading extends State<'edit', LevelEditorInit | null, LevelEditorInit | null> {
  g: LevelEditorInit | null = null;
  override onStart(i: LevelEditorInit): void {
    this.g = i;
    smb1marioFactory.new();
    smb1tilesFactory.new();
    smb1objectsFactory.new();
    smb1tilesanimationsFactory.new();
    smb1enemiesanimationsFactory.new();
    smb1objectsanimationsFactory.new();
  }

  override onUpdate(dt: number): boolean {
    return !(
      audio.controller.getloadingProgress() === 1
      && smb1marioFactory.getState() === 'ready'
      && smb1tilesFactory.getState() === 'ready'
      && smb1objectsFactory.getState() === 'ready'
      && smb1tilesanimationsFactory.getState() === 'ready'
      && smb1enemiesanimationsFactory.getState() === 'ready'
      && smb1objectsanimationsFactory.getState() === 'ready'
    );
  }

  override onEnd(): [LevelEditorInit | null, 'edit'] {
    return [this.g ? {
      graphics: this.g?.graphics,
      input: this.g?.input,
    } : null, "edit"];
  }
}

const loadingState = new Loading();
const gameplay = new Gameplay();

const levelEditor = new LevelEditor();
loadingState.connect(levelEditor, 'edit');
levelEditor.connect(gameplay, 'gameplay');
gameplay.connect(levelEditor, 'editor');

class Game extends Loop {
  state = "loading";

  input = new Input(display.getCanvas());
  graphics = new Graphics();
  smUpdate = loadingState.start(this);

  loading = 0;
  private async load() {this.loading = 1;}

  protected override onStart(): void {
    this.load();
    display.add(this.graphics);
    this.graphics.zIndex = -1;
  }

  protected override onFrameDraw(): void {
    this.input.update();

    // Ensure no funky stuff happens due to spikes
    const clampedDT = Math.min(1 / 24, Math.max(this.dt, 1 / 120));

    this.smUpdate(clampedDT);

    display.update(clampedDT);
    display.render();
  }
}

const game = new Game();
game.start();
