import { Graphics } from "pixi.js";
import State from "../engine/state-machine";
import display from "../display";
import { Input, Vec2d, aabb } from "../engine";
import detectTouching from "../systems/detectTouching";
import detectFloorSpeed from "../systems/detectFloorSpeed";
import marioPlayerInput from "../systems/marioPlayerInput";
import gravity from "../systems/gravity";
import marioMovement from "../systems/marioMovement";
import velocityChanges from "../systems/velocityChanges";
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
import entities, { Entity, newEntity } from "../entities";
import Culling from "../systems/culling";
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
import { LineSeg, OscillationInit, PlatformConnection, Points, Vine, Zone } from "../types";
import newPipe from "../entityFactories/newPipe";
import pipes from "../systems/pipes";
import coins from "../systems/coins";
import worldGrid from "../world-grid";
import Collidable from "../utils/collidable";
import vines from "../systems/vines";
import newTrampoline from "../entityFactories/newTrampoline";
import springs from "../systems/springs";
import platforms from "../systems/platforms";
import newPlatformConnection from "../entityFactories/newPlatformConnection";
import platformConnections from "../systems/platformConnectors";
import newClutter from "../entityFactories/newClutter";
import deathZones from "../systems/deathZones";
import enemyActivator from "../systems/enemyActivator";
import stuffVsEnemies from "../systems/stuffVsEnemies";
import iframes from "../systems/iframes";
import deleteTimer from "../systems/deleteTimer";
import deathAndRespawn from "../systems/deathAndRespawn";
import enemyBehaviours from "../systems/enemyBehaviours";
import newFirebar from "../entityFactories/newFirebar";
import firebar from "../systems/firebar";
import hammerbros from "../systems/hammerbros";
import Unloader from "../systems/unloader";
import Parallax from "../systems/parallax";
import npcs from "../systems/npcs";
import flags from "../systems/flags";
import checkpoints from "../systems/checkpoints";

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
  platformRoutes: LineSeg[];
  platformConnections: PlatformConnection[];
}
export type GameplayOut = {
  graphics: Graphics;
  input: Input;
}

export default class Gameplay extends State<'editor', GameplayInit | null, GameplayOut | null> {
  graphics?: Graphics;
  input?: Input;

  unloader = new Unloader();
  culling = new Culling();

  mouseX = 0;
  mouseY = 0;
  mousePrevX = 0;
  mousePrevY = 0;
  spanVel = new Vec2d(0, 0);

  scale = 1;

  respawnTimer?: number;

  parallax = new Parallax();

  // Lowest point for dynamics before they are destroyed
  lowestY = Infinity;

  private paused = false;

  private checkpoints: Set<Zone & {spawnpoint: {x: number; y: number;}}> = new Set();

  override onStart(init: GameplayInit | null): void {
    this.paused = false;

    this.lowestY = entities.view().reduce((a, c) => {
      const l = c.position.y;
      if (l > a) return l;
      return a;
    }, -Infinity);

    if (!init) return;
    this.graphics = init.graphics;
    this.input = init.input;

    for (const zoneGroup of Object.values(zones)) {
      zoneGroup.length = 0;
    }
    for (const zoneGroup of Object.keys(zones) as (keyof typeof zones)[]) {
      switch (zoneGroup) {
        case 'angrySun':
          zones.angrySun.push(...init.zones.angrySunZones); break;
        case 'bill':
          zones.bill.push(...init.zones.billZones); break;
        case 'camera':
          zones.camera.push(...init.zones.camZones); break;
        case 'cheep':
          zones.cheep.push(...init.zones.cheepZones); break;
        case 'darkbg':
          zones.darkbg.push(...init.zones.darkbgZones); break;
        case 'death':
          zones.death.push(...init.zones.deathZones); break;
        case 'fire':
          zones.fire.push(...init.zones.fireZones); break;
        case 'jumpCheep':
          zones.jumpCheep.push(...init.zones.jumpCheepZones); break;
        case 'lakitu':
          zones.lakitu.push(...init.zones.lakituZones); break;
        case 'loop':
          zones.loop.push(...init.zones.loopZones); break;
        case 'mask':
          zones.mask.push(...init.zones.maskZones); break;
        case 'medusaHead':
          zones.medusaHead.push(...init.zones.medusaHeadZones); break;
        case 'noInput':
          zones.noInput.push(...init.zones.noMarioInputZones); break;
        case 'preserveCamera':
          zones.preserveCamera.push(...init.zones.camPreserveZones); break;
        case 'unload':
          zones.unload.push(...init.zones.unloadZones); break;
        case 'surface':
          zones.surface.push(...init.zones.surfaceZones); break;
        case 'underwater':
          zones.underwater.push(...init.zones.underwaterZones); break;
        case 'whirlpool':
          zones.whirlpool.push(...init.zones.whirlpoolZones); break;
      }
    }

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
      let isVine = false;
      for (const u of worldGrid.statics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        const uu = u.userData;
        collidee.set(uu);

        if (aabb.rectVsRect(collider, collidee)) {
          uu.brick = false;
          uu.coinblock = 'vine';
          uu.vineCreator = vine;
          isVine = true;
          break;
        }
      }

      if (!isVine) {
        entities.createEntity(newEntity({
          lavabubble: {
            maxHeight: vine.h,
            t: Math.random(),
            maxT: 3
          },
          position: new Vec2d(vine.x, vine.y)
        }));
      }
    });
    init.trampolines.forEach(t => {
      newTrampoline(t.x, t.y, t.h);
    });
    function *movables(l: number, t: number, w: number, h: number) {
      yield* worldGrid.kinematics.findNear(l, t, w, h);
      yield* worldGrid.dynamics.findNear(l, t, w, h);
    }
    init.oscillations.forEach(o => {
      bb.l = o.pstart.x - 1;
      bb.t = o.pstart.y - 1;
      collider.pos.x = bb.l;
      collider.pos.y = bb.t;

      let isOscillator = false;
      for (const u of movables(bb.l, bb.t, bb.w, bb.h)) {
        const uu = u.userData;
        collidee.set(uu);
        if (aabb.rectVsRect(collider, collidee)) {
          isOscillator = true;
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

      if (!isOscillator) {
        // become a firebar
        const sizeVec = new Vec2d(o.p2.x, o.p2.y).sub(o.p1);
        const unit = sizeVec.scaledTo1().length();
        let size = sizeVec.length() / unit;
        if (Number.isNaN(size)) size = 16;
        size /= 2;
        size *= 6;
        const polar = sizeVec.toPolar();
        const angvel = ((o.pstart.x - o.p1.x) / 16) * Math.PI / 2;
        newFirebar(o.pstart.x, o.pstart.y, size, polar.y, angvel);
        console.log(o.pstart.x, o.pstart.y, size, polar.y, angvel)
      }
    });
    init.platformRoutes.forEach(o => {
      bb.l = o.p1.x - 1;
      bb.t = o.p1.y - 1;
      collider.pos.x = bb.l;
      collider.pos.y = bb.t;
      for (const u of worldGrid.kinematics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        const uu = u.userData;
        collidee.set(uu);
        if (aabb.rectVsRect(collider, collidee)) {
          uu.platform = {
            moveTo: {
              location: new Vec2d(o.p2.x, o.p2.y)
            }
          };
        }
      }
    });

    init.platformConnections.forEach(z => {
      const p1 = {...z.pin};
      p1.y += z.h1;
      const p2 = {...z.pin};
      p2.x += z.w;
      p2.y += z.h2;

      let platform1: Entity | null = null;
      let platform2: Entity | null = null;

      bb.l = p1.x - 1;
      bb.t = p1.y - 1;
      collider.pos.x = bb.l;
      collider.pos.y = bb.t;
      for (const u of worldGrid.kinematics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        const uu = u.userData;
        if (aabb.pointVsRect(uu.position, collider)) {
          uu.platform = {};
          platform1 = uu;
          break;
        }
      }

      bb.l = p2.x - 1;
      bb.t = p2.y - 1;
      collider.pos.x = bb.l;
      collider.pos.y = bb.t;
      for (const u of worldGrid.kinematics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        const uu = u.userData;
        if (aabb.pointVsRect(uu.position, collider)) {
          uu.platform = {};
          platform2 = uu;
          break;
        }
      }

      if (platform1 && platform2) newPlatformConnection(z.pin.x, z.pin.y, platform1, platform2, z.h1, z.h1 + z.h2);
    });

    init.zones.descendingPlatformZones.forEach(z => {
      bb.l = z.x;
      bb.t = z.y;
      bb.w = z.w;
      bb.h = z.h;
      collider.pos.x = bb.l;
      collider.pos.y = bb.t;
      collider.size.x = bb.w;
      collider.size.y = bb.h;

      const dx = !!init.oscillations.find(r => aabb.pointVsRect(r.pstart, collider)) ? 8 : 0;

      const moveUp = !!init.platformRoutes.find(r => aabb.pointVsRect(r.p1, collider) && r.p2.y < r.p1.y);

      for (const u of worldGrid.kinematics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        const uu = u.userData;
        if (aabb.pointVsRect(uu.position, collider)) {
          uu.platform = {
            bounded: {top: z.y, bottom: z.y + z.h}
          };
          if (!uu.kinematic) uu.kinematic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
          uu.kinematic.velocity.y = 50 * (moveUp ? -1 : 1);
          uu.position.x += dx;
        }
      }

      const rope = !!init.platformConnections.find(r => aabb.pointVsRect(r.pin, collider));

      if (rope) {
        const c = newClutter(collider.pos.x + collider.size.x * 0.5 + dx, collider.pos.y + collider.size.y * 0.5, {type: 'tile', frame: 'clutterSuspenderRopeVertical'});
        if (c.smb1TilesSprites) {
          c.smb1TilesSprites.container.scale.y = collider.size.y / 16;
          c.smb1TilesSprites.container.zIndex -= 1;
        }
      }
    });

    this.checkpoints.clear();
    init.zones.checkpointZones.forEach(z => {
      const internal = init.zones.checkpointZones.find(z2 => z2 !== z && aabb.pointVsRect({
        x: z2.x + z2.w * 0.5,
        y: z2.y + z2.h * 0.5
      }, {
        pos: {x: z.x, y: z.y},
        size: {x: z.w, y: z.h}
      }));

      if (!internal) return;

      const spawnpoint = {x: internal.x + internal.w * 0.5, y: internal.y + internal.h * 0.5};

      this.checkpoints.add({...z, spawnpoint});
    });

    this.unloader = new Unloader();
    this.unloader.limit = entities.view().reduce((a, c) => {
      const l = c.position.x;
      if (l < a) return l;
      return a;
    }, Infinity);

    this.culling = new Culling();
    this.culling.cullAll();
  }

  override onEnd(): [output: GameplayOut | null, next: 'editor'] {
    this.paused = false;
    this.respawnTimer = undefined;
    display.stopMoveTo();
    this.unloader.stop();

    for (const zoneGroup of Object.values(zones)) {
      zoneGroup.length = 0;
    }

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

    if (this.input.isPressed('KeyT')) {
      this.parallax.toggle();
    }

    if (this.paused !== pausedPrev) {
      audio.sounds.play('pause');
    }

    deathZones(this.lowestY, display);
    entities.update();

    for (const ent of entities.view(['mario'])) {
      if (this.input.isPressed('KeyH')) {
        if (ent.mario) {
          ent.mario.big = !ent.mario.big;
          ent.mario.changedSize = true;
        }
      }
      if (this.input.isPressed('KeyF')) {
        if (ent.mario) {
          ent.mario.powerup = ent.mario.powerup !== 'fire' ? 'fire' : undefined;
        }
      }
      if (this.input.isPressed('KeyU')) {
        if (ent.mario) {
          ent.underwater = !ent.underwater;
        }
      }
    }

    for (const e of entities.view(['displace'])) {
      if (!e.displace) continue;

      e.position.x += e.displace.x;
      e.position.y += e.displace.y;
      e.positionStart.x = e.position.x;
      e.positionStart.y = e.position.y;

      if (e.smb1EnemiesAnimations) {
        e.smb1EnemiesAnimations.container.position.x = e.position.x;
        e.smb1EnemiesAnimations.container.position.y = e.position.y;
      }

      delete e.displace;
    }

    this.graphics.clear();

    if (!this.paused) {

      flags(dt, display);

      npcs(dt, display);

      detectTouching();

      platforms(dt);

      detectFloorSpeed();

      // Inputs
      marioPlayerInput(this.input, dt);

      pipes(this.input, dt);

      // Apply accelerations
      gravity();
      marioMovement(dt);

      fireballs(dt);

      // Modification of velocities
      velocityChanges(dt);
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

      platformConnections();

      // Check if hit block with head
      blockhit(dt);

      coins(dt);

      vines(dt);

      springs(dt);

      movement(dt, display);

      firebar(dt);

      hammerbros(dt, display);

      enemyBehaviours(dt, display);

      stuffVsEnemies(dt, display);

      iframes(dt);

      dynamicCollisions();

      marioPowerups(dt);

      deleteTimer(dt);

      deathAndRespawn(dt, this);

      checkpoints(this.checkpoints);
    }

    // Render
    this.culling.update(display);
    debugRender(this.graphics);
    renderSmb1Stuff(dt);
    renderSmb1Mario(dt);

    if (!this.paused) {

      marioSmb1Sounds();

    }

    camera(display);
    enemyActivator(dt, display, this.paused);

    this.parallax.update(display);

    if (!this.paused) {

      // Cleanup
      resetStuff();

      for (const e of entities.view(['justAdded'])) {
        delete e.justAdded;
      }

    }

    this.unloader.unload();

    return true;
  }
}

(window as any).getViewPopulation = () => entities.getViewPopulation();