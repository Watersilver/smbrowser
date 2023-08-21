import { Graphics } from "pixi.js";
import State from "../engine/state-machine";
import display from "../display";
import { Input, Vec2d } from "../engine";
import detectTouching from "../systems/detectTouching";
import detectFloorSpeed from "../systems/detectFloorSpeed";
import marioPlayerInput from "../systems/marioPlayerInput";
import gravity from "../systems/gravity";
import marioMovement from "../systems/marioMovement";
import acceleration from "../systems/acceleration";
import addSpeedComponents from "../systems/addSpeedComponents";
import speedLimit from "../systems/speedLimit";
import physics from "../systems/physics";
import storePrevPos from "../systems/storePrevPos";
import velocity from "../systems/velocity";
import marioSizeHandler from "../systems/marioSizeHandler";
import removeSpeedComponents from "../systems/removeSpeedComponents";
import debugRender from "../systems/debugRender";
import renderSmb1Mario from "../systems/renderSmb1Mario";
import marioSmb1Sounds from "../systems/marioSmb1Sounds";
import resetStuff from "../systems/resetStuff";
import entities from "../entities";
import culling from "../systems/culling";
import renderSmb1Stuff from "../systems/renderSmb1Stuff";
import blockhit from "../systems/blockhit";
import movement from "../systems/movement";
import dynamicCollisions from "../systems/dynamicCollisions";
import marioPowerups from "../systems/marioPowerups";

export type GameplayInit = {
  graphics: Graphics;
  input: Input;
}

export default class Gameplay extends State<'editor', GameplayInit | null, GameplayInit | null> {
  graphics?: Graphics;
  input?: Input;

  mouseX = 0;
  mouseY = 0;
  mousePrevX = 0;
  mousePrevY = 0;
  spanVel = new Vec2d(0, 0);

  scale = 1;

  private t = 0;

  override onStart(init: GameplayInit | null): void {
    if (!init) return;
    this.graphics = init.graphics;
    this.input = init.input;
  }

  override onEnd(): [output: GameplayInit | null, next: 'editor'] {
    if (!this.graphics || !this.input) return [null, 'editor'];
    const graphics = this.graphics;
    const input = this.input;
    return [{
      graphics,
      input
    }, "editor"];
  }

  override onUpdate(dt: number): boolean {
    if (!this.graphics || !this.input) return false;

    if (this.input.isPressed('Space')) return false;

    entities.update();

    this.t += dt;
    while (this.t > Math.PI * 2) this.t -= Math.PI * 2;
    const xdis = Math.sin(this.t) * 33;
    const ydis = Math.sin(this.t) * 33;

    for (const ent of entities.view(['kinematic'])) {
      const xstart = ent.positionStart.x;
      const ystart = ent.positionStart.y;
      const x = xstart + xdis;
      const y = ystart + ydis;
      if (ent.kinematic) {
        const dx = x - ent.position.x;
        const dy = y - ent.position.y;
        ent.kinematic.velocity.x = dx / dt;
        ent.kinematic.velocity.y = dy / dt;
      }
    }

    for (const ent of entities.view(['mario'])) {
      if (this.input.isPressed('KeyH')) {
        if (ent.mario) {
          ent.mario.big = !ent.mario.big;
          ent.mario.changedSize = true;
        }
      }
      if (this.input.isPressed('KeyU')) {
        if (ent.mario) {
          ent.underwater = !ent.underwater;
        }
      }
    }

    this.graphics.clear();

    // Sensors
    detectTouching();
    detectFloorSpeed();

    // Inputs
    marioPlayerInput(this.input, dt);

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

    // Reset velocities to state before components were added
    removeSpeedComponents();

    // Check if hit block with head
    blockhit(dt);

    movement();

    dynamicCollisions();

    marioPowerups(dt);

    // Render
    culling(display);
    debugRender(this.graphics);
    renderSmb1Mario(dt);
    renderSmb1Stuff(dt);
    marioSmb1Sounds();

    // Camera
    for (const e of entities.view(['mario'])) {
      display.setScale(3);
      display.setCenter(e.position.x, e.position.y);
    }

    // Cleanup
    resetStuff();

    return true;
  }
}