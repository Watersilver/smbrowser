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

    // Reset volocities to state before components were added
    removeSpeedComponents();

    // Render
    debugRender(this.graphics);
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
  ent = entities.createEntity(newEntity({
    position: new Vec2d(1, 0),
    touchingUp: [],
    touchingDown: [],
    touchingLeft: [],
    touchingRight: [],
    hits: [],
    prevHits: [],
    size: new Vec2d(16, 16),
    dynamic: {
      velocity: new Vec2d(0, 0),
      acceleration: new Vec2d(0, 0),
      grounded: false,
    },
    player: true,
    marioInput: {inputs: {}},
    marioMovementConfig: {
      minWalkSpeed: 0x00130 * 60 / 0x01000,
      maxWalkSpeed: 0x01900 * 60 / 0x01000,
      walkAccel: 0x00098 * 60 * 60 / 0x01000,
      maxWalkSpeedUnderwater: 0x01100 * 60 / 0x01000,
      cutsceneWalkSpeed: 0x00D00 * 60 / 0x01000,
      maxRunSpeed: 0x02900 * 60 / 0x01000,
      runAccel: 0x000E4 * 60 * 60 / 0x01000,
      releaseDecel: 0x000D0 * 60 * 60 / 0x01000,
      skidDecel: 0x001A0 * 60 * 60 / 0x01000,
      skidTurnaround: 0x00900 * 60 / 0x01000,
      jumpBackwardsDecelThreshold: 0x01D00 * 60 / 0x01000,
      jumpFastAccel: 0x000E4 * 60 * 60 / 0x01000,
      jumpSlowAccel: 0x00098 * 60 * 60 / 0x01000,
      jumpFastDecel: 0x000E4 * 60 * 60 / 0x01000,
      jumpNormalDecel: 0x000D0 * 60 * 60 / 0x01000,
      jumpSlowDecel: 0x00098 * 60 * 60 / 0x01000,
      initFallGravity: 0x00280 * 60 * 60 / 0x01000,
      initJumpGravity: 0x00280 * 60 * 60 / 0x01000,
      walkGravitySpeed: 0x01000 * 60 / 0x01000,
      walkJump: 0x04000 * 60 / 0x01000,
      walkFallGravity: 0x00700 * 60 * 60 / 0x01000,
      walkJumpGravity: 0x00200 * 60 * 60 / 0x01000,
      midGravitySpeed: 0x024FF * 60 / 0x01000,
      midJump: 0x04000 * 60 / 0x01000,
      midFallGravity: 0x00600 * 60 * 60 / 0x01000,
      midJumpGravity: 0x001E0 * 60 * 60 / 0x01000,
      runJump: 0x05000 * 60 / 0x01000,
      runFallGravity: 0x00900 * 60 * 60 / 0x01000,
      runJumpGravity: 0x00280 * 60 * 60 / 0x01000,
      swimJump: 0x01800 * 60 / 0x01000,
      swimFallGravity: 0x000A0 * 60 * 60 / 0x01000,
      swimJumpGravity: 0x000D0 * 60 * 60 / 0x01000,
      whirlpoolJump: 0x01000 * 60 / 0x01000,
      whirlpoolFallGravity: 0x00090 * 60 * 60 / 0x01000,
      whirlpoolJumpGravity: 0x00040 * 60 * 60 / 0x01000,
      surfaceJump: 0x01800 * 60 / 0x01000,
      surfaceFallGravity: 0x00180 * 60 * 60 / 0x01000,
      surfaceJumpGravity: 0x00180 * 60 * 60 / 0x01000
    },
    mario: {
      facing: 1,
    },
    floorSpeed: 0,
    gravity: 0,
    smb1MarioAnimations: getMarioSmb1Sprites()
  }));
  override onStart(i: Game): void {
    this.g = i;
    display.add(this.graphics);

    const cr = (x: number, y: number) => entities.createEntity(newEntity({
      position: new Vec2d(x, y), size: new Vec2d(16, 16), static: true
    }));
    for (let i = -30; i < 20; i++) {
      cr(i * 16, 100);
    }
    cr(-9 * 16, 100 - 16);
    cr(-19 * 16, 100 - 16);
    cr(-19 * 16, 100 - 16 * 2);
    cr(-19 * 16, 100 - 16 * 3);
    cr(-19 * 16, 100 - 16 * 4);
    cr(-19 * 16, 100 - 16 * 5);
    cr(20 * 16, 100 - 16);
    cr(-16, 100 - 16 * 3);
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

    // Ensure no funky stuff happens due to spikes
    const clampedDT = Math.min(1 / 24, Math.max(this.dt, 1 / 120));

    this.smUpdate(clampedDT);

    display.render();
  }
}

const game = new Game();
game.start();
