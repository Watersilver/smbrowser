import { Sprite, Text } from "pixi.js";
import { getSmb1Audio } from "../audio";
import { Vec2d, aabb } from "../engine";
import entities, { Entity } from "../entities";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";
import { Display } from "../display";

const audio = getSmb1Audio();

const e1 = new Collidable();
const ep = new Collidable();
const u1 = new Collidable();
const up = new Collidable();

const text8000 = new Text('8000', {
  fontFamily: "Mario",
  fill: 'white'
});
const tAR = text8000.width / text8000.height;
text8000.width = 18;
text8000.height = text8000.width / tAR;
text8000.updateText(false);

const texts: {s: Sprite, life: number}[] = [];

function *dynamicsAndSensors(c: Collidable) {
  yield* worldGrid.dynamics.findNear(c.l, c.t, c.w, c.h);
  yield* worldGrid.sensors.findNear(c.l, c.t, c.w, c.h);
}

function *solids(c: Collidable) {
  yield* worldGrid.statics.findNear(c.l, c.t, c.w, c.h);
  yield* worldGrid.kinematics.findNear(c.l, c.t, c.w, c.h);
}

export default function stuffVsEnemies(dt: number, display: Display) {
  for (let i = texts.length - 1; i === 0; i--) {
    const text = texts[i];

    if (text) {
      text.s.position.y -= dt * 15;
      text.life -= dt;

      if (text.life <= 0) {
        texts.splice(i, 1);
        text.s.removeFromParent();
      }
    }
  }

  // See if mario hit
  for (const e of entities.view(['mario'])) {
    const m = e.mario;

    if (!m || m.dead || m.inPipe) continue;

    e1.set(e);

    let highestStomp: number | null = null;

    // Check for enemies
    for (const u of dynamicsAndSensors(e1)) {
      const uu = u.userData;

      if (uu === e) continue;

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
            const isStillShell = uu.enemy.isStillShell;
            const isMovingShel = uu.enemy.isMovingShell;

            let kickShell = false;
            let stopShell = false;

            // Mario touched enemy, but how?
            if (uu.enemy.stomp && (e.positionPrev.y + e.size.y * 0.5 <= uu.positionPrev.y - uu.size.y * 0.5)) {
              // Stomped
              delete uu.platform;
              if (isStillShell) {
                kickShell = true;
              } else {
                stopShell = true;

                // Mario moves out of enemy as much as possible because of stomp, unless something solid is blocking
                const top = uu.position.y - uu.size.y * 0.5;
                highestStomp = highestStomp === null ? top : highestStomp < top ? highestStomp : top;

                // Mario stomp bounce
                if (e.dynamic) {
                  e.dynamic.velocity.y = -150;
                }

                const a = uu.smb1EnemiesAnimations?.getAnimation();

                // Stomped sprite
                switch (a) {
                  case 'greenKoopashell':
                  case 'redKoopashell':
                  case 'buzzyShell':
                    break;
                  case 'greenParakoopa':
                    uu.smb1EnemiesAnimations?.setAnimation('greenKoopa');
                    break;
                  case 'greenKoopa':
                    if (uu.smb1EnemiesAnimations) {
                      uu.smb1EnemiesAnimations.setAnimation('greenKoopashell');
                      uu.smb1EnemiesAnimations.loopsPerSecond = 0;
                      uu.smb1EnemiesAnimations.setFrame(0);
                    }
                    break;
                  case 'redParakoopa':
                    uu.smb1EnemiesAnimations?.setAnimation('redKoopa');
                    break;
                  case 'redKoopa':
                    if (uu.smb1EnemiesAnimations) {
                      uu.smb1EnemiesAnimations.setAnimation('redKoopashell');
                      uu.smb1EnemiesAnimations.loopsPerSecond = 0;
                      uu.smb1EnemiesAnimations.setFrame(0);
                    }
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
                      uu.smb1EnemiesAnimations.container.scale.x *= -1;
                    }
                    break;
                }

                // Reaction to getting stomped
                delete uu.movement;
                if (uu.dynamic) {
                  uu.dynamic.velocity.x = 0;
                }
                switch (a) {
                  case 'greenKoopashell':
                  case 'redKoopashell':
                  case 'buzzyShell':
                    break;
                  case 'redParakoopa':
                  case 'greenParakoopa':
                    uu.movement = {
                      horizontal: -50 * Math.sign(uu.smb1EnemiesAnimations?.container.scale.x ?? 1),
                      horizontalNow: true,
                      flipEachOther: true,
                      dontFallOff: a === 'redParakoopa'
                    };
                    uu.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
                    uu.hits = [];
                    uu.gravity = 600;
                    uu.enemy = {
                      star: true,
                      stomp: true,
                      fireball: true,
                      shell: true,
                      lookTowards: 'direction'
                    };
                    uu.touchingDown = [];
                    break;
                  case 'redKoopa':
                  case 'greenKoopa':
                  case 'buzzy':
                    uu.movement = {
                      horizontal: 0,
                      horizontalNow: true,
                      ignoreSoftHits: true
                    };
                    uu.enemy.isStillShell = true;
                    uu.enemy.shellTimer = 5;
                    break;
                  case 'goomba':
                    delete uu.enemy;
                    uu.deleteOutOfCam = true;
                    uu.deleteTimer = 1;
                    break;
                  default:
                    delete uu.enemy;
                    delete uu.bill;
                    delete uu.lakitu;
                    delete uu.spiny;
                    delete uu.sensor;
                    uu.goThrougWalls = true;
                    uu.deleteOutOfCam = true;
                    uu.gravity = 600;
                    uu.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
                    break;
                }

                // Sound
                switch (a) {
                  case 'greenKoopashell':
                  case 'redKoopashell':
                  case 'buzzyShell':
                    if (isMovingShel) audio.sounds.play('stomp');
                    break;
                  default:
                    audio.sounds.play('stomp');
                    break;
                }
              }
            } else {
              // Touch but no stomp
              kickShell = true;
              if (!e.iframesSecs && !isStillShell && !e.enemy?.harmless) {
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

            // Shell kick and stop logic
            if (kickShell && isStillShell) {
              if (!uu.touchingDown?.length || (uu.enemy?.shellTimer !== undefined && uu.enemy.shellTimer < 0.05)) {
                const text = new Sprite(text8000.texture);
                text.position.x = uu.position.x;
                text.position.y = uu.position.y;
                text.width = text8000.width;
                text.height = text8000.height;
                text.anchor.set(.5);
                display.add(text);
                texts.push({s: text, life: 0.75});
                if (e.player) e.player.kicks8k++;
              }
              if (uu.enemy) {
                if (uu.smb1EnemiesAnimations) {
                  uu.smb1EnemiesAnimations.loopsPerSecond = 0;
                  uu.smb1EnemiesAnimations.setFrame(0);
                }
                uu.enemy.isMovingShell = true;
                uu.enemy.isStillShell = false;
                delete uu.enemy.shellTimer;
                uu.enemy.harmless = 0.05;
              }
              uu.movement = {
                horizontalNow: true,
                flipEachOther: false,
                horizontal: (Math.sign(uu.position.x - e.position.x) || 1) * 222
              };
              audio.sounds.play('kick');
            } else if (stopShell && isMovingShel) {
              if (uu.enemy) {
                uu.enemy.isMovingShell = false;
                uu.enemy.isStillShell = true;
                uu.enemy.shellTimer = 5;
              }
              uu.movement = {
                horizontalNow: true,
                flipEachOther: true,
                horizontal: 0
              };
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

  // Reactions to getting hit by stuff
  for (const e of entities.view(['enemy', 'gotHit'])) {
    const s = e.smb1EnemiesAnimations;

    if (!s || !e.gotHit) continue;

    // If true, reaction will be to become a flipped shell
    const shellFlip =
      (
        e.gotHit.by === 'soft-bonk'
        && e.smb1EnemiesAnimations?.getAnimation() === 'greenParakoopa'
      ) ||
      (
        e.gotHit.by === 'bonk'
        && (
          e.enemy?.isMovingShell
          || e.enemy?.isStillShell
          || e.smb1EnemiesAnimations?.getAnimation().toLowerCase().includes('koopa')
          || e.smb1EnemiesAnimations?.getAnimation() === 'buzzy'
        )
      )

    if (shellFlip) {
      // Become a flipped shell
      audio.sounds.play('kick');
      e.movement = {
        horizontal: (Math.sign(e.position.x - e.gotHit.x) || 1) * 60,
        horizontalNow: true,
        bounce: -155,
        bounceOnce: true,
        bounceNow: true,
        bounceStopHorizontal: true,
        ignoreSoftHits: true
      };
      if (e.enemy) {
        e.enemy.isStillShell = true;
        e.enemy.shellTimer = 5;
      }

      if (e.smb1EnemiesAnimations) {
        if (e.smb1EnemiesAnimations.getAnimation().toLowerCase().includes('red')) {
          e.smb1EnemiesAnimations.setAnimation('redKoopashell');
        } else if (e.smb1EnemiesAnimations.getAnimation().toLowerCase().includes('green')) {
          e.smb1EnemiesAnimations.setAnimation('greenKoopashell');
        } else {
          e.smb1EnemiesAnimations.setAnimation('buzzyShell');
        }
        e.smb1EnemiesAnimations.container.angle = 180;
      }

      s.loopsPerSecond = 0;
      s.setFrame(0);
    } else if (e.gotHit.by === 'bonk' && e.spiny) {
      // Spiny doesn't die by bonk
      if (e.enemy) {
        e.enemy.noDirChangeOnNextLanding = true;
        if (e.movement?.horizontal) {
          e.movement.horizontal = Math.sign(e.position.x - e.gotHit.x) * 50;
          e.movement.horizontalNow = true;
          e.movement.bounce = -133;
          e.movement.bounceNow = true;
          e.movement.bounceOnce = true;
        }
      }
    } else if (e.gotHit.by !== 'soft-bonk') {
      // Die by hit
      audio.sounds.play('kick');
      if (e.piranhaPlant) {
        entities.remove(e);
      } else {
        delete e.movement;
        delete e.enemy;
        delete e.sensor;
        delete e.blooper;
        delete e.cheep;
        delete e.bill;
        delete e.lakitu;
        delete e.spiny;
        delete e.platform;
        s.container.angle = 180;
        s.container.scale.x = -s.container.scale.x;
        s.container.zIndex = 15;
        s.loopsPerSecond = 0;
        e.gravity = e.underwater ? 300 : 600;
        e.goThrougWalls = true;
        e.dynamic = {
          velocity: new Vec2d(
            e.underwater ? 0 : Math.sign(e.position.x - e.gotHit.x) * 50,
            e.underwater ? 0 : -133
          ),
          acceleration: new Vec2d(0, 0)
        },
        e.maxSpeed = 300;
      }
    }
    delete e.gotHit;
  }

  for (const e of entities.view(['enemy', 'hits', 'prevHits'])) {

    if (!e.enemy || e.enemy.isMovingShell || !e.hits || !e.prevHits) continue;

    const closest = entities.view(['mario']).filter(m => !m.mario?.dead).reduce<Entity | undefined>((a, c) => {
      if (!a) return c;
      if (a.position.distance(e.position) > c.position.distance(e.position)) return c;
      return a;
    }, undefined);

    const justHit = e.hits?.some(h => h.normal.y < 0)
    && !e.prevHits?.some(h => h.normal.y < 0);

    if (e.movement) {
      if (
        closest
        && justHit
        && e.position.y !== e.positionPrev.y
      ) {
        if (e.enemy.noDirChangeOnNextLanding) {
          delete e.enemy.noDirChangeOnNextLanding;
          continue;
        }

        e.movement.horizontal = Math.sign(closest.position.x - e.position.x) * Math.abs(e.movement.horizontal || 0);
        e.movement.horizontalNow = true;
      } else if (justHit) {
        e.movement.horizontalNow = true;
      }
    }
  }

  for (const e of entities.view(['spiny', 'hits'])) {

    if (!e.hits || !e.smb1EnemiesAnimations) continue;

    if (
      e.hits?.some(h => h.normal.y < 0)
    ) {
      e.smb1EnemiesAnimations.setAnimation('spiny');
    }
  }

  for (const e of entities.view(['enemy'])) {

    if (!e.enemy) continue;

    // Got hit hard (or not) by block below getting bonked
    const h = e.touchingDown?.find(h => h.bonked);
    if (h) {
      e.gotHit = {x: h.position.x, y: h.position.y, by: 'bonk'};
    } else {
      const w = e.touchingDown?.reduce((a: Entity | undefined, c) => {
        if (!a && typeof c.hitAnim === 'number') return c;
        return (a?.hitAnim ?? 0) > (c.hitAnim ?? Infinity) ? c : a;
      }, undefined);
      if (w?.hitAnim && w.hitAnim < 0.1) e.gotHit = {x: w.position.x, y: w.position.y, by: 'soft-bonk'};
    }

    // Stop being harmless over time
    if (e.enemy.harmless !== undefined) {
      e.enemy.harmless -= dt;
      if (e.enemy.harmless <= 0) {
        delete e.enemy.harmless;
      }
    }

    e1.set(e);
    for (const u of worldGrid.dynamics.findNear(e1.l, e1.t, e1.w, e1.h)) {
      if (u.userData.fireball) {
        u1.set(u.userData);
  
        if (aabb.rectVsRect(e1, u1)) {
          if (u.userData.dynamic) u.userData.dynamic.velocity.x = 0;
          if (e.enemy.fireball) {
            // Got hit by fireball
            u.userData.fireballHitEnemy = true;
            e.gotHit = {x: u.userData.position.x, y: u.userData.position.y, by: 'fireball'};
          }
        }
      } else if (u.userData.enemy?.isMovingShell) {
        if (u.userData === e) continue;

        u1.set(u.userData);

        if (aabb.rectVsRect(e1, u1)) {
          if (e.enemy.shell) {
            // Got hit by shell
            u.userData.fireballHitEnemy = true;
            e.gotHit = {x: u.userData.position.x, y: u.userData.position.y, by: 'shell'};
          }
        }
      }
    }
  }
}