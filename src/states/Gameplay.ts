import { Graphics } from "pixi.js";
import State from "../engine/state-machine";
import display from "../display";
import { Input, Vec2d, aabb } from "../engine";
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
import { getSmb1Audio } from "../audio";
import fireballs from "../systems/fireballs";
import type LevelEditor from "./LevelEditor";
import zones from "../zones";
import camera from "../systems/camera";
import { OscillationInit, Points, Vine } from "../types";
import newPipe from "../entityFactories/newPipe";
import pipes from "../systems/pipes";
import coins from "../systems/coins";
import worldGrid from "../world-grid";
import Collidable from "../utils/collidable";
import vines from "../systems/vines";
import newTrampoline from "../entityFactories/newTrampoline";
import springs from "../systems/springs";
import platforms from "../systems/platforms";

const audio = getSmb1Audio();

const _zero2D: [x: number, y: number] = [0, 0];
function _vectorToSegment2D(t: number, P: [x: number, y: number], A: [x: number, y: number], B: [x: number, y: number]): [x: number, y: number] {
  return [
    (1 - t) * A[0] + t * B[0] - P[0],
    (1 - t) * A[1] + t * B[1] - P[1],
  ];
}
function _sqDiag2D(P: [x: number, y: number]) { return P[0] ** 2 + P[1] ** 2; }
function closestPointBetween2D(P: [x: number, y: number], A: [x: number, y: number], B: [x: number, y: number]) {
  const v: [x: number, y: number] = [B[0] - A[0], B[1] - A[1]];
  const u: [x: number, y: number] = [A[0] - P[0], A[1] - P[1]];
  const vu = v[0] * u[0] + v[1] * u[1];
  const vv = v[0] ** 2 + v[1] ** 2;
  const t = -vu / vv;
  if (t >= 0 && t <= 1) return _vectorToSegment2D(t, _zero2D, A, B);
  const g0 = _sqDiag2D(_vectorToSegment2D(0, P, A, B));
  const g1 = _sqDiag2D(_vectorToSegment2D(1, P, A, B));
  return g0 <= g1 ? A : B;
}

export type GameplayInit = {
  graphics: Graphics;
  input: Input;
  zones: LevelEditor['zones'];
  pipes: Points[];
  vines: Vine[];
  trampolines: Vine[];
  oscillations: OscillationInit[];
}
export type GameplayOut = {
  graphics: Graphics;
  input: Input;
}

export default class Gameplay extends State<'editor', GameplayInit | null, GameplayOut | null> {
  graphics?: Graphics;
  input?: Input;

  mouseX = 0;
  mouseY = 0;
  mousePrevX = 0;
  mousePrevY = 0;
  spanVel = new Vec2d(0, 0);

  scale = 1;

  private paused = false;

  override onStart(init: GameplayInit | null): void {
    this.paused = false;

    if (!init) return;
    this.graphics = init.graphics;
    this.input = init.input;

    zones.camera.push(...init.zones.camZones);
    zones.death.push(...init.zones.deathZones);
    zones.preserveCamera.push(...init.zones.camPreserveZones);
    zones.noInput.push(...init.zones.noMarioInputZones);
    zones.surface.push(...init.zones.surfaceZones);
    zones.underwater.push(...init.zones.underwaterZones);
    zones.whirlpool.push(...init.zones.whirlpoolZones);

    init.pipes.forEach(pipe => {
      newPipe(pipe);
      newPipe([...pipe].reverse());
    });

    const bb = {l: 0, t: 0, w: 2, h: 2};
    const collider = {pos: {x: 0, y: 0}, size: {x: 2, y: 2}};
    const collidee = new Collidable();
    init.vines.forEach(vine => {
      bb.l = vine.x - 1;
      bb.t = vine.y - 1;
      collider.pos.x = bb.l;
      collider.pos.y = bb.t;
      for (const u of worldGrid.statics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        const uu = u.userData;
        collidee.set(uu);

        if (aabb.rectVsRect(collider, collidee)) {
          uu.brick = false;
          uu.coinblock = 'vine';
          uu.vineCreator = vine;
          continue;
        }
      }
    });
    init.trampolines.forEach(t => {
      newTrampoline(t.x, t.y, t.h);
    });
    init.oscillations.forEach(o => {
      bb.l = o.pstart.x - 1;
      bb.t = o.pstart.y - 1;
      collider.pos.x = bb.l;
      collider.pos.y = bb.t;
      for (const u of worldGrid.kinematics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        const uu = u.userData;
        collidee.set(uu);
        if (aabb.rectVsRect(collider, collidee)) {
          uu.platform = {};
          const middle = new Vec2d(o.p1.x, o.p1.y).add(new Vec2d(o.p2.x, o.p2.y).sub(o.p1).mul(0.5));

          const c = closestPointBetween2D([o.pstart.x, o.pstart.y], [o.p1.x, o.p1.y], [o.p2.x, o.p2.y]);
          const cv2d = new Vec2d(c[0], c[1]);
          const direction = Math.sign(middle.sub(cv2d).unit().dot(middle.sub(o.p1).unit()));

          const x0 = direction * middle.sub(cv2d).length();

          const amplitude = new Vec2d(o.p1.x, o.p1.y).sub(o.p2).length() * 0.5;

          let phase = -Math.acos(x0 / amplitude) || 0;

          uu.position.x = cv2d.x;
          uu.position.y = cv2d.y;
          uu.positionStart.x = cv2d.x;
          uu.positionStart.y = cv2d.y;
          uu.positionPrev.x = cv2d.x;
          uu.positionPrev.y = cv2d.y;
          uu.platform.oscillate = {
            from: new Vec2d(o.p1.x, o.p1.y),
            to: new Vec2d(o.p2.x, o.p2.y),
            middle,
            freq: 1,
            t: 0,
            phase
          };
          continue;
        }
      }
    })
  }

  override onEnd(): [output: GameplayOut | null, next: 'editor'] {
    this.paused = false;
    display.stopMoveTo();

    zones.camera.length = 0;
    zones.death.length = 0;
    zones.preserveCamera.length = 0;
    zones.noInput.length = 0;
    zones.surface.length = 0;
    zones.underwater.length = 0;
    zones.whirlpool.length = 0;

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

    const pausedPrev = this.paused;
    if (this.input.isPressed('KeyP')) {
      this.paused = !this.paused;
    }

    if (this.paused !== pausedPrev) {
      audio.sounds.play('pause');
    }

    entities.update();

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

    if (!this.paused) {

      platforms(dt);

      // Sensors
      detectTouching();
      detectFloorSpeed();

      // Inputs
      marioPlayerInput(this.input, dt);

      pipes(this.input, dt);

      // Apply accelerations
      gravity();
      marioMovement(dt);

      fireballs();

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

      coins(dt);

      vines(dt);

      springs(dt);

      movement();

      dynamicCollisions();

      marioPowerups(dt);
    }

    // Render
    culling(display);
    debugRender(this.graphics);
    renderSmb1Stuff(dt);
    renderSmb1Mario(dt);

    if (!this.paused) {

      marioSmb1Sounds();

    }

    camera(display);

    if (!this.paused) {

      // Cleanup
      resetStuff();

    }

    return true;
  }
}