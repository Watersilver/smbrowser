import './config'
import { Graphics } from "pixi.js";
import display from "./display"
import { Input, Loop, Vec2d } from "./engine"
import State from "./engine/state-machine"
import { getSmb1Audio } from "./audio";
import LevelEditor, { LevelEditorInit } from './states/LevelEditor';
import { EntityTypeMapping } from './types';
import Gameplay from './states/Gameplay';

display.setBGColor('#9290FF');
display.setBGColor('#044');
display.countFps();
display.showFps();

const audio = getSmb1Audio();

class Loading extends State<'test', LevelEditorInit | null, LevelEditorInit | null> {
  g: LevelEditorInit | null = null;
  override onStart(i: LevelEditorInit): void {
    this.g = i;
  }

  override onUpdate(dt: number): boolean {
    return audio.controller.getloadingProgress() !== 1;
  }

  override onEnd(): [LevelEditorInit | null, 'test'] {
    const ents = [
      [
        EntityTypeMapping.mario,
        1, 0
      ],
    ];
    for (let i = -30; i < 20; i++) {
      if (i !== 14) ents.push([EntityTypeMapping.block, i * 16+8, 16*5+8]);
    }
    ents.push([EntityTypeMapping.block, -9 * 16+8, 16*5+8 - 16]);
    ents.push([EntityTypeMapping.block, -19 * 16+8, 16*5+8 - 16]);
    ents.push([EntityTypeMapping.block, -19 * 16+8, 16*5+8 - 16 * 2]);
    ents.push([EntityTypeMapping.block, -19 * 16+8, 16*5+8 - 16 * 3]);
    ents.push([EntityTypeMapping.block, -19 * 16+8, 16*5+8 - 16 * 4]);
    ents.push([EntityTypeMapping.block, -19 * 16+8, 16*5+8 - 16 * 5]);
    ents.push([EntityTypeMapping.block, 20 * 16+8, 16*5+8 - 16]);
    ents.push([EntityTypeMapping.block, -16+8, 16*5+8 - 16 * 3]);
    ents.push([EntityTypeMapping.block, -16 * 4+8, 16*5+8 - 16 * 2]);
    ents.push([EntityTypeMapping.kinematic, 0, 0]);
    return [this.g ? {
      graphics: this.g?.graphics,
      input: this.g?.input,
      levelDataInit: JSON.stringify({
        entities: ents
      })
    } : null, "test"];
  }
}

const loadingState = new Loading();
const gameplay = new Gameplay();

const levelEditor = new LevelEditor();
loadingState.connect(levelEditor, 'test');
levelEditor.connect(gameplay, 'gameplay');
gameplay.connect(levelEditor, 'editor');

class Game extends Loop {
  state = "loading"

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

    display.render();
  }
}

const game = new Game();
game.start();
