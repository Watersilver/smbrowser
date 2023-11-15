import './config'
import { Container, Graphics, Text } from "pixi.js";
import display from "./display"
import { Input, Loop } from "./engine"
import State from "./engine/state-machine"
import { getSmb1Audio } from "./audio";
import LevelEditor, { LevelEditorInit } from './states/LevelEditor';
import Gameplay from './states/Gameplay';
import smb1marioFactory from './sprites/loaders/smb1/mario';
import smb1tilesFactory from './sprites/loaders/smb1/tiles';
import smb1titleFactory from './sprites/loaders/smb1/title';
import smb1objectsFactory from './sprites/loaders/smb1/objects';
import smb1tilesanimationsFactory from './sprites/loaders/smb1/animated-tiles';
import smb1enemiesanimationsFactory from './sprites/loaders/smb1/enemies';
import smb1objectsanimationsFactory from './sprites/loaders/smb1/animated-objects';
import Title from './states/Title';
import musicDisplayer from './systems/musicDisplayer';

display.setBGColor('#000000');
// display.countFps();
// display.showFps();

const audio = getSmb1Audio();
audio.music.onReadyState(() => {
  const n = audio.music.getMusic()?.name;
  if (n) musicDisplayer.setNext(n);
  else musicDisplayer.deleteData();
});

try {
  const v = localStorage.getItem('mst-vol');
  if (v) {
    audio.controller.setVolume(Number(v));
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

type LoadingOut = LevelEditorInit & {mario?: Container; title?: Container; text?: Text} | null;
class Loading extends State<'loaded', LevelEditorInit | null, LoadingOut> {
  g: LevelEditorInit | null = null;
  gzInit: any;

  o: Container = new Container();
  musicProgress = new Text("Audio: 0%", {
    fontFamily: "Mario",
    fill: 'white'
  });
  graphicsProgress = new Text("Graphics: 0%", {
    fontFamily: "Mario",
    fill: 'white'
  });
  t = 0.2;

  mario: Container | null = null;
  title: Container | null = null;
  text: Text | null = null;

  t1 = 0;

  override onStart(i: LevelEditorInit): void {
    this.g = i;
    this.gzInit = this.g.graphics.zIndex;
    this.g.graphics.zIndex = 9999999;
    this.o = new Container();
    this.o.zIndex = 99999999;
    this.musicProgress.anchor.set(0.5);
    this.graphicsProgress.anchor.set(0.5);
    this.graphicsProgress.pivot.y = -16;
    this.musicProgress.pivot.y = +16;
    this.o.addChild(this.musicProgress, this.graphicsProgress);
    display.add(this.o);
    this.o.position.x = 0;
    this.o.position.y = -400;
    display.setCenter(this.o.position.x, this.o.position.y);
    smb1marioFactory.new();
    smb1tilesFactory.new();
    smb1objectsFactory.new();
    smb1tilesanimationsFactory.new();
    smb1enemiesanimationsFactory.new();
    smb1objectsanimationsFactory.new();

    const t = smb1titleFactory.new();
    const tParent = new Container();
    tParent.addChild(t.container);
    display.add(tParent);
    tParent.position.set(this.o.position.x - 48, this.o.position.y - 64);
    this.title = t.container;
    const m = smb1titleFactory.new();
    m.setFrame('marioface');
    display.add(m.container);
    m.container.position.set(this.o.position.x + 128, this.o.position.y - 64);
    this.mario = m.container;
    this.text = new Text("Press ENTER to start the game", {
      fontFamily: "Mario",
      fill: '#be0000',
      strokeThickness: 16,
      fontSize: 64
    });
    this.text.visible = false;
    this.text.scale.set(0.2);
    this.text.anchor.set(0.5, 0.5);
    this.text.position.set(this.o.position.x, this.o.position.y + 64);
    display.add(this.text);
  }

  override onUpdate(dt: number): boolean {
    if (this.g) {
      const g = this.g.graphics;
      g.clear();

      const {l,t,b,r} = display.getBoundingBox();
      g.lineStyle(1, 0x000000, 1);
      g.beginFill(0x000000, 1);
      g.drawRect(
        l,
        t,
        r - l,
        b - t
      );
      g.endFill();
    }

    this.musicProgress.text = `Audio: ${Math.floor(audio.controller.getloadingProgress() * 100)}%`;

    let prog = 0;
    prog += smb1marioFactory.getState() === 'ready' ? 1 : 0;
    prog += smb1tilesFactory.getState() === 'ready' ? 1 : 0;
    prog += smb1titleFactory.getState() === 'ready' ? 1 : 0;
    prog += smb1objectsFactory.getState() === 'ready' ? 1 : 0;
    prog += smb1tilesanimationsFactory.getState() === 'ready' ? 1 : 0;
    prog += smb1enemiesanimationsFactory.getState() === 'ready' ? 1 : 0;
    prog += smb1objectsanimationsFactory.getState() === 'ready' ? 1 : 0;

    this.graphicsProgress.text = `Graphics: ${Math.floor((prog / 7) * 100)}%`;

    const isReady = (
      audio.controller.getloadingProgress() === 1
      && prog === 7
    );

    if (isReady) {
      this.t -= dt;
    }

    return this.t > 0;
  }

  override onEnd(): [LoadingOut, 'loaded'] {
    if (this.g) this.g.graphics.zIndex = this.gzInit;
    this.o.removeFromParent();
    return [this.g ? {
      graphics: this.g.graphics,
      input: this.g.input,
      mario: this.mario ?? undefined,
      title: this.title ?? undefined,
      text: this.text ?? undefined
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
    const f = document.getElementById('fullscreen');
    if (f) f.style.display = 'none';

    this.input.update();

    // Ensure no funky stuff happens due to spikes
    const clampedDT = Math.min(1 / 24, Math.max(this.dt, 1 / 120));

    display.update(clampedDT);
    this.sm.update(clampedDT);

    const s = this.sm.getState();
    const paused = s instanceof Gameplay ? s.isPaused() : false;
    musicDisplayer.update(clampedDT, paused);

    display.render();
  }
}

const game = new Game();
game.start();
