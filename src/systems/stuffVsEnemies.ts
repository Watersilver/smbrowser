import { getSmb1Audio } from "../audio";
import { Vec2d, aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

const audio = getSmb1Audio();

const e1 = new Collidable();
const ep = new Collidable();
const u1 = new Collidable();
const up = new Collidable();

function *dynamicsAndSensors(c: Collidable) {
  yield* worldGrid.dynamics.findNear(c.l, c.t, c.w, c.h);
  yield* worldGrid.sensors.findNear(c.l, c.t, c.w, c.h);
}

function *solids(c: Collidable) {
  yield* worldGrid.statics.findNear(c.l, c.t, c.w, c.h);
  yield* worldGrid.kinematics.findNear(c.l, c.t, c.w, c.h);
}

export default function stuffVsEnemies(dt: number) {

  // See if mario hit
  for (const e of entities.view(['mario'])) {
    const m = e.mario;

    if (!m) continue;

    e1.set(e);

    let highestStomp: number | null = null;

    // Check for enemies
    for (const u of dynamicsAndSensors(e1)) {
      const uu = u.userData;

      if (!uu.enemy) continue;

      u1.set(uu);

      if (aabb.rectVsRect(e1, u1)) {
        // Will collide but what will happen?

        if (m.star) {
          if (uu.enemy.star) {
            uu.gotHit = {x: e.position.x, y: e.position.y, by: 'star'};
          }
        } else {
          ep.set(e, undefined, true);
          up.set(uu, undefined, true);
          const prevHit = aabb.rectVsRect(ep, up);

          // Can stomp or get damaged only if previously not hit
          if (!prevHit) {
            if (uu.enemy.stomp && (e.positionPrev.y + e.size.y * 0.5 <= uu.positionPrev.y - uu.size.y * 0.5)) {

              const top = uu.position.y - uu.size.y * 0.5;
              highestStomp = highestStomp === null ? top : highestStomp < top ? highestStomp : top;

              if (e.dynamic) {
                e.dynamic.velocity.y = -150;
              }

              const a = uu.smb1EnemiesAnimations?.getAnimation();

              delete uu.movement;
              delete uu.enemy;
              if (uu.dynamic) {
                uu.dynamic.velocity.x = 0;
              }

              // Sprite
              switch (a) {
                case 'greenKoopa':
                case 'greenParakoopa':
                  uu.smb1EnemiesAnimations?.setAnimation('greenKoopashell');
                  break;
                case 'redKoopa':
                case 'redParakoopa':
                  uu.smb1EnemiesAnimations?.setAnimation('redKoopashell');
                  break;
                case 'buzzy':
                  uu.smb1EnemiesAnimations?.setAnimation('buzzyShell');
                  break;
                case 'goomba':
                  if (uu.smb1EnemiesAnimations) {
                    uu.smb1EnemiesAnimations.setAnimation('goombaDead');
                    uu.smb1EnemiesAnimations.container.zIndex -= 1;
                  }
                  break;
                default:
                  if (uu.smb1EnemiesAnimations) {
                    uu.smb1EnemiesAnimations.container.angle = 180;
                  }
                  break;
              }

              // Reaction
              switch (a) {
                case 'greenKoopashell':
                case 'redKoopashell':
                case 'buzzyShell':
                  break;
                case 'greenKoopa':
                case 'greenParakoopa':
                case 'redKoopa':
                case 'redParakoopa':
                case 'buzzy':
                  break;
                case 'goomba':
                  uu.deleteOutOfCam = true;
                  uu.deleteTimer = 1;
                  break;
                default:
                  uu.goThrougWalls = true;
                  uu.deleteOutOfCam = true;
                  break;
              }

              // Sound
              switch (a) {
                case 'greenKoopashell':
                case 'redKoopashell':
                case 'buzzyShell':
                  break;
                default:
                  audio.sounds.play('stomp');
                  break;
              }
            } else if (!e.iframesSecs) {
              e.iframesSecs = 3;

              if (m.big) {
                m.big = false;
                m.changedSize = true;
              } else if (m.powerup) {
                delete m.powerup;
                m.changedSize = true;
              } else if (m) {
                delete e.iframesSecs;
                m.dead = true;
              }
            }
          }
        }
      }
    }

    if (highestStomp !== null) {
      const targetTop = highestStomp - e.size.y;
      const diff = targetTop - e1.t;
      e1.dr.y = diff;

      let targetPoint = e.position.y + diff;

      for (const solid of solids(e1)) {
        u1.set(solid.userData);
        const [hit, col] = aabb.dynamicRectVsRect(e1, u1);

        if (hit) {
          targetPoint = targetPoint < col.point.y ? col.point.y : targetPoint;
        }
      }

      e.position.y = targetPoint;
    }
  }

  for (const e of entities.view(['enemy'])) {
    const h = e.touchingDown?.find(h => h.bonked);
    if (h) e.gotHit = {x: h.position.x, y: h.position.y, by: 'bonk'};

    if (!e.enemy) continue;
    if (e.enemy.fireball === false) continue;

    e1.set(e);
    for (const u of worldGrid.dynamics.findNear(e1.l, e1.t, e1.w, e1.h)) {
      if (!u.userData.fireball) continue;

      u1.set(u.userData);

      if (aabb.rectVsRect(e1, u1)) {
        if (u.userData.dynamic) u.userData.dynamic.velocity.x = 0;
        u.userData.fireballHitEnemy = true;
        e.gotHit = {x: u.userData.position.x, y: u.userData.position.y, by: 'fireball'};
      }
    }
  }

  // TODO: shells

  for (const e of entities.view(['enemy', 'gotHit'])) {
    const s = e.smb1EnemiesAnimations;

    if (!s || !e.gotHit) continue;

    switch (s.getAnimation()) {
      default:
        audio.sounds.play('kick');
        delete e.movement;
        delete e.enemy;
        s.container.angle = 180;
        s.container.zIndex = 15;
        s.loopsPerSecond = 0;
        e.gravity = 600;
        e.goThrougWalls = true;
        e.dynamic = {
          velocity: new Vec2d(
            Math.sign(e.position.x - e.gotHit.x) * 50,
            -133
          ),
          acceleration: new Vec2d(0, 0)
        }
        break;
    }
  }
}