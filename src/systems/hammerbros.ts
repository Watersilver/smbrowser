import { Display } from "../display";
import { Vec2d } from "../engine";
import entities from "../entities";
import newEnemy from "../entityFactories/newEnemy";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

// Preload views
entities.view(['nonspinningHammer']);
entities.view(['hammerbro']);

const c1 = new Collidable();
const c2 = new Collidable();

export default function hammerbros(dt: number, display: Display) {

  for (const e of entities.view(['nonspinningHammer'])) {
    if (!e.dynamic || !e.smb1EnemiesAnimations) continue;

    if (Math.abs(e.dynamic.velocity.y) < 20) {
      const towards = Math.sign(e.dynamic.velocity.x) === -e.smb1EnemiesAnimations.container.scale.x
      e.smb1EnemiesAnimations.setFrame(towards ? 1 : 3);
    } else if (e.dynamic.velocity.y > 0) {
      e.smb1EnemiesAnimations.setFrame(2);
    } else {
      e.smb1EnemiesAnimations.setFrame(0);
    }
  }

  for (const e of entities.view(['hammerbro'])) {
    c1.set(e);
    if (!display.overlapsRectBroad(c1)) {
      if (e.dynamic) e.dynamic.velocity.x = 0;
      continue;
    }

    if (!e.hammerbro || !e.dynamic || !e.smb1EnemiesAnimations || !e.touchingDown || !e.gravity) continue;

    e.hammerbro.dirChangeTimer -= dt;

    if (e.hammerbro.dirChangeTimer < 0) {
      e.hammerbro.dirChangeTimer = 1 + Math.random() * 0.2;
      e.hammerbro.direction = e.hammerbro.direction < 0 ? 1 : -1;
    }

    e.dynamic.velocity.x = e.hammerbro.direction * 20;

    if (e.hammerbro.hammerTelegraphTimer < 0 && e.hammerbro.hammertime < 0) {
      const choice = Math.random();
      if (choice < 0.05) {
        e.hammerbro.hammertime = 1.8;
      } else if (choice < 0.25) {
        e.hammerbro.hammertime = 1.2;
      } else {
        e.hammerbro.hammertime = 0.66;
      }
    }

    if (e.hammerbro.hammerTelegraphTimer >= 0) {
      e.smb1EnemiesAnimations.setAnimation('hammerbroAttack');
      e.hammerbro.hammerTelegraphTimer -= dt;

      if (e.hammerbro.hammerTelegraphTimer < 0) {
        const h = newEnemy(e.position.x, e.position.y - 12, 'hammer');
        const direction = -e.smb1EnemiesAnimations.container.scale.x;
        if (h.smb1EnemiesAnimations) {
          h.smb1EnemiesAnimations.container.scale.x = -direction;

          const hammerRotType = Math.random();

          if (hammerRotType < 0.1) {
            h.smb1EnemiesAnimations.loopsPerSecond *= -0.5;
          } else if (hammerRotType < 0.15) {
            h.smb1EnemiesAnimations.loopsPerSecond = 0;
            h.nonspinningHammer = true;
          } else if (hammerRotType < 0.70) {
            h.smb1EnemiesAnimations.loopsPerSecond *= 2;
          }
        }
        h.gravity = 300;
        h.goThrougWalls = true;
        h.deleteOutOfCam = true;
        h.dynamic = {
          velocity: new Vec2d(direction * 40 + Math.random() * 10, -150),
          acceleration: new Vec2d(0, 0)
        };
        h.enemy = {
          // fireballGoesThrough: true,
          fireball: true,
          star: true,
          shell: true,
          stomp: false
        };
        h.hammer = true;
      }
    } else {
      e.smb1EnemiesAnimations.setAnimation('hammerbro');

      e.hammerbro.hammertime -= dt;

      if (e.hammerbro.hammertime < 0) {
        e.hammerbro.hammerTelegraphTimer = Math.random() > 0.75 ? 1 : 0.5;
      }
    }

    if (e.hammerbro.jumping) {
      // When going down, become solid again after being below jumpstart (or maybe a little more)
      // When going up become solid after starting going down
      if (e.hammerbro.jumping.direction === 'up') {
        if (e.dynamic.velocity.y > 0) {
          delete e.goThrougWalls;
          delete e.hammerbro.jumping;
        }
      } else {
        if (e.position.y > e.hammerbro.jumping.startHeight + 48) {
          delete e.goThrougWalls;
          delete e.hammerbro.jumping;
        }
      }
    } else if (e.touchingDown.length) {
      // init jump timer
      if (e.hammerbro.nextJumpTimer < 0) {
        // 3 random jump times. A very short very rare one. a normal one and a long one
        const timerChoice = Math.random();
        e.hammerbro.nextJumpTimer = timerChoice < 0.05 ? 0.5 : timerChoice < 0.5 ? 5 : 3;
      }

      e.hammerbro.nextJumpTimer -= dt;

      // jump if timer expires
      if (e.hammerbro.nextJumpTimer < 0) {
        // If there are double bricks below me, never jump with down direction, otherwise 50% 50% top bottom
        let canJumpDown = true;
        let height: number | null = null;
        for (const u of worldGrid.statics.findNear(c1.l, c1.t + c1.h, c1.w, c1.h)) {
          c2.set(u.userData);
          if (height === null) {
            height = u.userData.position.y;
          } else if (height !== u.userData.position.y) {
            // Different height, so there is a stack of two bricks below -> don't jump down
            canJumpDown = false;
            break;
          }
        }

        e.hammerbro.jumping = {
          startHeight: e.position.y,
          direction: !canJumpDown ? 'up' : Math.random() < 0.5 ? 'down' : 'up'
        };

        // determine velocity
        if (e.hammerbro.jumping.direction === 'up') {
          e.dynamic.velocity.y = -Math.sqrt(2 * e.gravity * 72);
        } else {
          e.dynamic.velocity.y = -Math.sqrt(2 * e.gravity * 8);
        }
        e.goThrougWalls = true;
      }
    }
  }
}