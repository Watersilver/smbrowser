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

class Loading extends State<'test', Game | null, Game | null> {
  g: Game | null = null;
  override onStart(i: Game): void {
    this.g = i;
  }

  override onUpdate(dt: number): boolean {
    return false;
  }

  override onEnd(): [Game | null, 'test'] {
    return [this.g, "test"];
  }
}

class Test extends State<string, Game> {
  override onUpdate(dt: number): boolean {
    entities.update();

    this.t += dt;
    while (this.t > Math.PI * 2) this.t -= Math.PI * 2;
    const xmod = Math.sin(this.t) * 33;
    const ymod = Math.sin(this.t) * 33;
    this.graphics.clear();
    this.graphics.lineStyle(3, 0x00ff00, 1);
    this.graphics.beginFill(0, 0);
    this.graphics.drawRect(this.x + xmod, this.y + ymod, this.w, this.h);
    this.graphics.endFill();

    // Sensors
    detectTouching();

    // Inputs
    marioPlayerInput(this.g.input, dt);

    // Apply accelerations
    marioMovement(dt);
    gravity(100, dt);

    // Modification of velocities
    acceleration(dt);

    // Limiting velocities
    speedLimit();

    // Final total velocity
    physics(dt);

    // Modification of position
    storePrevPos();
    velocity(dt);

    // Render
    debugRender(this.graphics);

    // Cleanup
    resetStuff();

    return true;
  }

  g!: Game;
  graphics = new Graphics();
  x = 44;
  y = 44;
  w = 22;
  h = 22;
  t = 0;
  ent = entities.createEntity(newEntity({
    position: new Vec2d(1, 0),
    touchingUp: [],
    touchingDown: [],
    touchingLeft: [],
    touchingRight: [],
    hits: [],
    size: new Vec2d(16, 16),
    dynamic: {
      velocity: new Vec2d(0, 0),
      acceleration: new Vec2d(0, 0),
      grounded: false,
    },
    player: true,
    marioInput: {inputs: {}},
    marioMovementConfig: {
      // minWalkSpeed: 0x00130,
      // maxWalkSpeed: 0x01900,
      // walkAccel: 0x00098,
      // maxWalkSpeedUnderwater: 0x01100,
      // cutsceneWalkSpeed: 0x00D00,
      // maxRunSpeed: 0x02900,
      // runAccel: 0x000E4,
      // releaseDeccel: 0x000D0,
      // skidDeccel: 0x001A0,
      // skidTurnaround: 0x00900

      minWalkSpeed: 0x00130 * 60 / 0x01000,
      maxWalkSpeed: 0x01900 * 60 / 0x01000,
      walkAccel: 0x00098 * 60 * 60 / 0x01000,
      maxWalkSpeedUnderwater: 0x01100 * 60 / 0x01000,
      cutsceneWalkSpeed: 0x00D00 * 60 / 0x01000,
      maxRunSpeed: 0x02900 * 60 / 0x01000,
      runAccel: 0x000E4 * 60 * 60 / 0x01000,
      releaseDecel: 0x000D0 * 60 * 60 / 0x01000,
      skidDecel: 0x001A0 * 60 * 60 / 0x01000,
      skidTurnaround: 0x00900 * 60 / 0x01000
    },
    mario: {
      facing: 1
    }
  }));
  override onStart(i: Game): void {
    this.g = i;
    display.add(this.graphics);

    const cr = (x: number, y: number) => entities.createEntity(newEntity({
      position: new Vec2d(x, y), size: new Vec2d(16, 16), static: true
    }));
    for (let i = -10; i < 20; i++) {
      cr(i * 16, 100);
    }
  }

  override onEnd(): [undefined, string] {
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

    this.smUpdate(this.dt);

    display.render();
  }
}

const game = new Game();
game.start();
