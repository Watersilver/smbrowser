import { Display } from "../display";
import { Vec2d } from "../engine";
import entities from "../entities";
import universal from "../universal";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

const rect = new Collidable();

const enemyGravity = universal.enemyGravity;

export default function enemyActivator(dt: number, display: Display, paused: boolean) {
  
  // Number of enemActivateOnVisible could get bloated so just use grid to determine enemies to activate
  const [l, t] = display.fromViewport(0, 0);
  const [r, b] = display.fromViewport(display.getViewportWidth(), display.getViewportHeight());

  for (const u of worldGrid.grid.findNear(l,t,r-l,b-t)) {
    const e = u.userData;
    
    const eaov = e.enemActivateOnVisible;

    if (!eaov) continue;

    rect.set(e);
    rect.pos.x--;
    rect.pos.y--;
    rect.size.x += 2;
    rect.size.y += 2;

    if (!display.overlapsRectBroad(rect)) continue;

    let dontDelete = false;

    switch (eaov) {
      case 'bouncyKoop':
        if (e.smb1EnemiesAnimations) e.smb1EnemiesAnimations.loopsPerSecond = 3;
        e.movement = {
          horizontal: -33,
          horizontalNow: true,
          flipEachOther: true,
          bounce: true
        };
        e.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
        e.hits = [];
        e.gravity = enemyGravity;
        e.enemy = {
          star: true,
          stomp: true,
          fireball: true,
          shell: true,
          lookTowards: 'direction'
        };
        e.touchingDown = [];
        break;
      case 'koopaG':
      case 'koopaR':
      case 'buzzy':
      case 'koopaG':
      case 'goomba':
        e.movement = {
          horizontal: -universal.enemySpeed,
          horizontalNow: true,
          flipEachOther: true,
          dontFallOff: eaov === 'koopaR'
        };
        e.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
        e.hits = [];
        e.prevHits = [];
        e.gravity = enemyGravity;
        e.enemy = {
          star: true,
          stomp: true,
          fireball: eaov !== 'buzzy',
          shell: true,
          lookTowards: 'direction'
        };
        e.touchingDown = [];
        break;
      case 'bowser':
      case 'bruce':
        break;
      case 'hammerbro':
        e.enemy = {
          stomp: true,
          fireball: true,
          star: true,
          shell: true,
          lookTowards: 'mario'
        };
        e.dynamic = {
          acceleration: new Vec2d(0, 0),
          velocity: new Vec2d(0, 0)
        };
        e.hammerbro = {
          nextJumpTimer: -1,
          hammerTelegraphTimer: -1,
          hammertime: -1,
          dirChangeTimer: -1,
          direction: Math.random() > 0.5 ? -1 : 1
        };
        e.gravity = enemyGravity;
        e.touchingDown = [];
        break;
      case 'blooper':
        e.enemy = {
          stomp: false,
          fireball: true,
          star: true,
          shell: true
        }
        e.sensor = true;
        e.moving = true;
        e.blooper = {};
        e.underwater = true;
        break;
      case 'plant':
        e.enemy = {
          star: true,
          stomp: false,
          fireball: true,
          shell: true
        };
        e.sensor = true;
        e.moving = true;
        e.piranhaPlant = {
          height: 0
        }
        break;
      default:
        dontDelete = true;
    }

    if (!dontDelete) delete e.enemActivateOnVisible;
  }

  // Reactivate shells
  if (!paused) for (const e of entities.view(['enemy'])) {
    if (!e.enemy?.isStillShell || e.enemy.shellTimer === undefined) continue;

    e.enemy.shellTimer -= dt;

    if (e.smb1EnemiesAnimations && e.enemy.shellTimer <= 1) {
      e.smb1EnemiesAnimations.loopsPerSecond = 3;
    }

    if (e.enemy.shellTimer < 0) {
      const anim = e.smb1EnemiesAnimations?.getAnimation();
      e.smb1EnemiesAnimations?.setAnimation(anim === 'buzzyShell' ? 'buzzy' : anim === 'redKoopashell' ? 'redKoopa' : 'greenKoopa');
      if (e.smb1EnemiesAnimations) {
        e.smb1EnemiesAnimations.loopsPerSecond = 4;
        e.smb1EnemiesAnimations.container.angle = 0;
      }
      e.movement = {
        horizontal: universal.enemySpeed * (Math.sign(Math.random() || 1)),
        horizontalNow: true,
        flipEachOther: true,
        dontFallOff: anim === 'redKoopashell'
      };
      e.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
      e.hits = [];
      e.gravity = enemyGravity;
      e.enemy = {
        star: true,
        stomp: true,
        fireball: anim !== 'buzzyShell',
        shell: true,
        lookTowards: 'direction'
      };
      e.touchingDown = [];
    }
  }
}