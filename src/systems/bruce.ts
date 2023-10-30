import { getSmb1Audio } from "../audio";
import { Display } from "../display";
import { Vec2d, aabb } from "../engine";
import { Sound } from "../engine/audio-controller";
import entities, { Entity } from "../entities";
import newBowserfire from "../entityFactories/newBowserfire";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";
import zones from "../zones";

const audio = getSmb1Audio();

const c1 = new Collidable();
const c2 = new Collidable();

function deletePrevBowserfireZones(bruce: Entity) {

  c1.set(bruce);

  const set = new Set(zones.fire);
  for (const zone of set) {
    if (zone.x < bruce.positionStart.x) {
      set.delete(zone);

      if (aabb.rectVsRect(c1, c2.setToZone(zone))) {
        if (bruce.bruce) {
          bruce.bruce.zone = {
            l: zone.x,
            r: zone.x + zone.w,
            b: zone.y + zone.h
          };
        }
      }
    }
  }
  zones.fire = [...set];
}

entities.onPropChange('bruce', deletePrevBowserfireZones);

export default function bruce(dt: number, display: Display) {
  for (const e of entities.view(['bruce'])) {
    if (!e.bruce || !e.smb1EnemiesAnimations || !e.dynamic) continue;

    const grounded = !!e.touchingDown?.length;

    c1.set(e);
    for (const f of entities.view(['fireball'])) {
      if (f.fireballHitEnemy) continue;
      c2.set(f);
      if (aabb.rectVsRect(c1, c2)) {
        if (f.dynamic) {
          f.dynamic.velocity.x = 0;
        }
        f.fireballHitEnemy = true;
        audio.sounds.play('kick');
        e.bruce.health -= 1;
      }
    }

    const marioGottentPast = entities.view(['mario']).some(m => !m.mario?.dead && m.position.x > e.position.x);

    if (marioGottentPast) {
      e.bruce.changingModesTimer += dt;
    } else {
      e.bruce.changingModesTimer = 0;
    }

    if (e.bruce.changingModesTimer > 1 && grounded) {
      // Just move right
      if (e.movement) {
        e.movement.horizontal = 30;
        e.movement.horizontalNow = true;
      } else {
        e.movement = {
          horizontal: 30,
          horizontalNow: true
        };
      }
    } else {
      if (e.bruce.dirChangeTimer < 0) {
        e.bruce.dirChangeTimer = 1 + Math.random() * 2;
      }

      if (e.bruce.nextFireTimer < 0) {
        e.bruce.nextFireTimer = Math.random() * 5 + 0.5;
      }

      if (e.bruce.nextJumpTimer < 0) {
        e.bruce.nextJumpTimer = Math.random() * 5 + 0.5;
      }

      if (grounded) e.bruce.dirChangeTimer -= dt;
      if (e.bruce.firing === undefined) {
        e.bruce.nextFireTimer -= dt;

        e.smb1EnemiesAnimations.setAnimation('bruceOpenMouth');
      } else {
        e.bruce.firing -= dt;

        e.smb1EnemiesAnimations.setAnimation('bruceClosedMouth');
        if (e.bruce.firing <= 0) {
          delete e.bruce.firing;

          const {l, w} = display.getBoundingBox();
          if (l + w > e.position.x) {
            const random = Math.random();
            newBowserfire(
              e.position.x - e.smb1EnemiesAnimations.container.scale.x * 21,
              e.position.y - 8,
              (e.bruce.zone?.b ?? (e.positionStart.y + 8)) - 16 * (random < 0.33 ? 2 : random < 0.66 ? 1 : 0) - 8
            );
          }
        }
      }
      if (grounded) e.bruce.nextJumpTimer -= dt;

      if (e.bruce.dirChangeTimer < 0) {
        if (!grounded) {
          e.bruce.dirChangeTimer = 0;
        } else {
          e.bruce.direction = e.bruce.direction === 1 ? -1 : 1;
        }
      }

      if (e.bruce.nextFireTimer < 0) {
        e.bruce.firing = 0.5;
      }

      if (e.bruce.nextJumpTimer < 0) {
        e.dynamic.velocity.y = -125;
      }

      const horizontal = (grounded ? 30 : 15) * e.bruce.direction;
      if (e.movement) {
        e.movement.horizontal = horizontal;
        e.movement.horizontalNow = true;
      } else {
        e.movement = {
          horizontal,
          horizontalNow: true
        };
      }
    }

    if (e.bruce.zone) {
      if (e.position.x >= e.bruce.zone.r) {
        e.bruce.direction = -1;
      }
      if (e.position.x <= e.bruce.zone.l) {
        e.bruce.direction = 1;
      }
    }

    if (e.bruce.health <= 0) {
      delete e.bruce;
      delete e.enemy;
      delete e.movement;
      e.dynamic = {
        acceleration: new Vec2d(0, 0),
        velocity: new Vec2d(0, -80)
      };
      audio.sounds.play('bowserfalls');
      e.goThrougWalls = true;
      e.smb1EnemiesAnimations.container.scale.y = -1;
      e.smb1EnemiesAnimations.loopsPerSecond = 0;
    }
  }

  for (const e of entities.view(['axe', 'hits'])) {
    if (e.hits?.filter(h => h.e.mario && h.normal.y < 0).length) {
      entities.remove(e);

      const {l,r,t,b} = display.getBoundingBox();

      const bb: Entity[] = [];

      for (const u of worldGrid.statics.findNear(l,t,r-l,b-t)) {
        if (u.userData.smb1TilesSprites?.getFrame() === 'solidBowserBridge') {
          bb.push(u.userData);
        }
      }

      let bruce: Entity[] = [];
      for (const u of worldGrid.dynamics.findNear(l,t,r-l,b-t)) {
        if (u.userData.bruce) {
          bruce.push(u.userData);
          delete u.userData.bruce;
          delete u.userData.dynamic;
          delete u.userData.movement;
          delete u.userData.enemy;
        }
      }

      bb.sort((a, b) => b.position.x - a.position.x);

      let i = 0;
      for (const b of bb) {
        i++;
        const j = i;
        let s: Sound | null = null;
        setTimeout(() => {
          if (s) s.stop();
          s = audio.sounds.play('breakblock');
          entities.remove(b);
          if (j === bb.length - 1) {
            setTimeout(() => audio.sounds.play('stage_clear'), 1000);
            bruce.forEach(br => {
              audio.sounds.play('bowserfalls');
              br.goThrougWalls = true;
              if (br.smb1EnemiesAnimations) br.smb1EnemiesAnimations.loopsPerSecond = 0;
              br.dynamic = {
                acceleration: new Vec2d(0, 0),
                velocity: new Vec2d(0, 0)
              };
            });
          }
        }, i * 125);
      }

      for (const u of worldGrid.grid.findNear(l,t,r-l,b-t)) {
        if (u.userData.smb1TilesSprites?.getFrame() === 'clutterCastleBridgeChain') {
          entities.remove(u.userData);
        }
      }
    }
  }
}