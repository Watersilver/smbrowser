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
import Title from './states/Title';
import musicDisplayer from './systems/musicDisplayer';

display.setBGColor('#9290FF');
display.countFps();
display.showFps();

const audio = getSmb1Audio();
audio.music.onReadyState(() => {
  const n = audio.music.getMusic()?.name;
  if (n) musicDisplayer.setNext(n);
});

try {
  const v = localStorage.getItem('mst-vol');
  if (v) {
    audio.sounds.setVolume(Number(v));
  }
  const sv = localStorage.getItem('snd-vol');
  if (sv) {
    audio.sounds.setVolume(Number(sv));
  }
  const mv = localStorage.getItem('msc-vol');
  if (mv) {
    audio.music.setVolume(Number(mv));
  }
} catch (err) {
  console.error(err);
}

class Loading extends State<'loaded', LevelEditorInit | null, LevelEditorInit | null> {
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

  override onEnd(): [LevelEditorInit | null, 'loaded'] {
    return [this.g ? {
      graphics: this.g.graphics,
      input: this.g.input,
    } : null, "loaded"];
  }
}

const loadingState = new Loading();
const gameplay = new Gameplay();

const url = new URL(window.location.href);
const query = new URLSearchParams(window.location.search);
const isLocalhost = url.host.includes('localhost');
const isEditMode = isLocalhost && query.get('edit') !== null;

if (isEditMode) {
  const levelEditor = new LevelEditor();
  loadingState.connect(levelEditor, 'loaded');
  levelEditor.connect(gameplay, 'gameplay');
  gameplay.connect(levelEditor, 'editor');
} else {
  const title = new Title();
  loadingState.connect(title, 'loaded');
  title.connect(gameplay, 'gameplay');
  gameplay.connect(title, 'title');
}

class Game extends Loop {
  state = "loading";

  input = new Input(display.getCanvas());
  graphics = new Graphics();
  sm = loadingState.start(this);

  loading = 0;
  private async load() {this.loading = 1;}

  protected override onStart(): void {
    this.load();
    display.add(this.graphics);
    this.graphics.zIndex = -1;

    const v = document.getElementById('volume');
    if (v) {
      const i = v.getElementsByTagName('input');

      const master = i.item(0);
      const sound = i.item(1);
      const music = i.item(2);

      if (master) {
        master.value = (audio.controller.getVolume() * 100).toString();
        master.addEventListener("input", e => {
          if (e.target instanceof HTMLInputElement) {
            const n = Number(e.target.value) / 100;
            audio.controller.setVolume(n);
            localStorage.setItem('mst-vol', n.toString());
          }
        });
      }

      if (sound) {
        sound.value = (audio.sounds.getVolume() * 100).toString();
        sound.addEventListener("input", e => {
          if (e.target instanceof HTMLInputElement) {
            const n = Number(e.target.value) / 100;
            audio.sounds.setVolume(n);
            localStorage.setItem('snd-vol', n.toString());
          }
        });
      }

      if (music) {
        music.value = (audio.music.getVolume() * 100).toString();
        music.addEventListener("input", e => {
          if (e.target instanceof HTMLInputElement) {
            const n = Number(e.target.value) / 100;
            audio.music.setVolume(n);
            localStorage.setItem('msc-vol', n.toString());
          }
        });
      }
    }
  }

  protected override onFrameDraw(): void {
    const v = document.getElementById('volume');
    if (v) v.style.display = 'none';

    this.input.update();

    // Ensure no funky stuff happens due to spikes
    const clampedDT = Math.min(1 / 24, Math.max(this.dt, 1 / 120));

    display.update(clampedDT);
    this.sm.update(clampedDT);

    const paused = this.sm.state instanceof Gameplay ? this.sm.state.isPaused() : false;
    musicDisplayer.update(clampedDT, paused);

    display.render();
  }
}

const game = new Game();
game.start();
