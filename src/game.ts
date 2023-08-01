import './config'
import { Graphics } from "pixi.js";
import display from "./display"
import { Input, Loop, Vec2d } from "./engine"
import State from "./engine/state-machine"
import acceleration from "./systems/acceleration";
import velocity from "./systems/velocity";
import entities, { newEntity } from "./entities";
import debugRender from "./systems/debugRender";
import speedLimit from "./systems/speedLimit";
import gravity from "./systems/gravity";
import storePrevPos from "./systems/storePrevPos";
import physics from "./systems/physics";
import marioPlayerInput from "./systems/marioPlayerInput";
import resetStuff from "./systems/resetStuff";
import detectTouching from "./systems/detectTouching";
import marioMovement from "./systems/marioMovement";
import addSpeedComponents from "./systems/addSpeedComponents";
import removeSpeedComponents from "./systems/removeSpeedComponents";
import detectFloorSpeed from "./systems/detectFloorSpeed";
import { getSmb1Audio } from "./audio";
import marioSmb1Sounds from "./systems/marioSmb1Sounds";
import { getMarioSmb1Sprites } from './sprites';
import renderSmb1Mario from './systems/renderSmb1Mario';
import marioSizeHandler from './systems/marioSizeHandler';
import newMario from './entityFactories/newMario';

display.setBGColor('#9290FF');
display.setBGColor('#044');
display.showFps();

const audio = getSmb1Audio();

class Loading extends State<'test', Game | null, Game | null> {
  g: Game | null = null;
  override onStart(i: Game): void {
    this.g = i;
  }

  override onUpdate(dt: number): boolean {
    return audio.controller.getloadingProgress() !== 1;
  }

  override onEnd(): [Game | null, 'test'] {
    return [this.g, "test"];
  }
}

class Test extends State<string, Game> {
  override onUpdate(dt: number): boolean {
    if (!this.g) return false;
    entities.update();

    this.t += dt;
    while (this.t > Math.PI * 2) this.t -= Math.PI * 2;
    const xdis = Math.sin(this.t) * 33;
    const ydis = Math.sin(this.t) * 33;
    const xstart = this.platform.positionStart.x;
    const ystart = this.platform.positionStart.y;
    const x = xstart + xdis;
    const y = ystart + ydis;
    if (this.platform.kinematic) {
      const dx = x - this.platform.position.x;
      const dy = y - this.platform.position.y;
      this.platform.kinematic.velocity.x = dx / dt;
      this.platform.kinematic.velocity.y = dy / dt;
    }

    if (this.g.input.isPressed('KeyH')) {
      if (this.ent.mario) {
        this.ent.mario.big = !this.ent.mario.big;
        this.ent.mario.changedSize = true;
      }
    }
    if (this.g.input.isPressed('KeyU')) {
      if (this.ent.mario) {
        this.ent.underwater = !this.ent.underwater;
      }
    }

    this.graphics.clear();

    // Sensors
    detectTouching();
    detectFloorSpeed();

    // Inputs
    marioPlayerInput(this.g.input, dt);

    // Apply accelerations
    gravity();
    marioMovement(dt);

    // Modification of velocities
    acceleration(dt);
    addSpeedComponents();

    // Limiting velocities
    speedLimit();

    // Final total velocity
    physics(dt);

    // Modification of position
    storePrevPos();
    velocity(dt);

    marioSizeHandler();

    // Reset volocities to state before components were added
    removeSpeedComponents();

    // Render
    debugRender(this.graphics);
    renderSmb1Mario(dt);
    marioSmb1Sounds();

    // Cleanup
    resetStuff();

    return true;
  }

  g?: Game;
  graphics = new Graphics();
  t = 0;
  platform = entities.createEntity(newEntity({
    position: new Vec2d(144, 22),
    size: new Vec2d(22, 6),
    kinematic: {
      velocity: new Vec2d(0, 0),
      acceleration: new Vec2d(0, 0)
    }
  }));
  ent = newMario(1, 0);
  override onStart(i: Game): void {
    this.g = i;
    display.add(this.graphics);
    this.graphics.zIndex = -1;

    const cr = (x: number, y: number) => entities.createEntity(newEntity({
      position: new Vec2d(x, y), size: new Vec2d(16, 16), static: true
    }));
    for (let i = -30; i < 20; i++) {
      if (i !== 14) cr(i * 16, 100);
    }
    cr(-9 * 16, 100 - 16);
    cr(-19 * 16, 100 - 16);
    cr(-19 * 16, 100 - 16 * 2);
    cr(-19 * 16, 100 - 16 * 3);
    cr(-19 * 16, 100 - 16 * 4);
    cr(-19 * 16, 100 - 16 * 5);
    cr(20 * 16, 100 - 16);
    cr(-16, 100 - 16 * 3);
    cr(-16 * 4, 100 - 16 * 2);
  }

  override onEnd(): [undefined, string] {
    this.graphics.removeFromParent();
    return [undefined, "string"];
  }
}

const loadingState = new Loading();
const testState = new Test();
loadingState.connect(testState, 'test');

class Game extends Loop {
  state = "loading"

  input = new Input();
  smUpdate = loadingState.start(this);

  loading = 0;
  private async load() {this.loading = 1;}

  protected override onStart(): void {
    this.load();
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
