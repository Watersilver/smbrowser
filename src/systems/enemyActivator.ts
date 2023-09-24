import { Display } from "../display";
import { Vec2d } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";

const rect = new Collidable();

const enemyGravity = 600;

export default function enemyActivator(dt: number, display: Display) {
  
  for (const e of entities.view(['enemActivateOnVisible'])) {
    
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
          horizontal: -50,
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
      case 'flyingKoopa':
      case 'hammerbro':
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
  for (const e of entities.view(['enemy'])) {
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
        horizontal: 50 * (Math.sign(Math.random() || 1)),
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
        fireball: anim === 'buzzyShell',
        shell: true,
        lookTowards: 'direction'
      };
      e.touchingDown = [];
    }
  }
}