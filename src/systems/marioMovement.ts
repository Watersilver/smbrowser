import { aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";
import zones from "../zones";

// Preload views
entities.view(['marioInput',
'marioMovementConfig',
'dynamic',
'mario']);

const collider = new Collidable();
const collidee = new Collidable();

export default function marioMovement(dt: number, parameters?: {conservationOfMomentum?: boolean}) {
  for (const e of entities.view([
    'marioInput',
    'marioMovementConfig',
    'dynamic',
    'mario'
  ])) {
    const config = e.marioMovementConfig;
    const mi = e.marioInput;
    const dynamic = e.dynamic;
    const mario = e.mario;
    // const upBlocked = !!e.touchingUp?.length;
    const leftBlocked = !!e.touchingLeft?.length;
    const rightBlocked = !!e.touchingRight?.length;
    const downBlocked = !!e.touchingDown?.length;

    if (config && mi && dynamic && mario && !mario.cutscene) {

      if (dynamic.velocity.y >= 0) {
        delete mario.trampolinePropulsion;
      }

      e.underwater = zones.underwater.some(z => aabb.pointVsRect(e.position, collidee.setToZone(z)));
      mario.surface = zones.surface.some(z => aabb.pointVsRect(e.position, collidee.setToZone(z)));
      const whirl = zones.whirlpool.find(z => aabb.pointVsRect(e.position, collidee.setToZone(z)));

      if (whirl) {
        mario.whirlpool = true;
        let diff = (whirl.x + 0.5 * whirl.w) - e.position.x;
        if (Math.abs(diff) < 10) diff = 0;
        mario.wind = Math.sign(diff) * 30;
      } else {
        delete mario.whirlpool;
        delete mario.wind;
      }

      const underwater = !!e.underwater;
      const i = mi.inputs;
      const jumped = (underwater || downBlocked || mario.climbing) && i.jump && !mario.jumpCooldown;
      const grounded = downBlocked && !jumped && !mario.jumpCooldown;

      e.gravity = e.gravity || config.initFallGravity;

      mario.jumped = false;

      if (mario.jumpCooldown) {
        mario.jumpCooldown -= dt;
        if (mario.jumpCooldown <= 0) mario.jumpCooldown = 0;
      }

      const dir = Math.sign(dynamic.velocity.x);
      let speed = Math.abs(dynamic.velocity.x);

      const side = i.left ? -1 : i.right ? 1 : 0;
      
      mario.prevGrounded = mario.grounded;

      // If this is check isn't here, getting up while holding directional key moves us a little
      const wasDucking = mario.ducking;
      const ducking = mario.forcedDucking || mario.ducking || wasDucking;

      if (mario.onSpring) {
        if (mario.onSpring.spring.spring?.progress === undefined) {
          mario.jumpCooldown = 5 / 60;
          // find the maximum height of a projectile:
          // h = v0 ^ 2 * sin(theta) / (2 * g)
          // Theta is 0 because we are throwing vertically (at 90 deg) thus:
          // v0 ^ 2 = 2 * h * g =>
          // v0 = sqrt(2*h*g)
          let h = (mario.onSpring.spring.spring?.h ?? 0);
          h -= 24;
          if (h < 0) h = 0;
          const vyFree = ((mario.jumpSpeed ?? 0) + dynamic.velocity.y);
          const vyJump = Math.max(vyFree, Math.sqrt(2 * h * config.walkJumpGravity));
          dynamic.acceleration.y = i.jumping ? -vyJump / dt : -vyFree / dt;
          dynamic.acceleration.x = 0.25 * mario.onSpring.vx / dt;
          mario.trampolinePropulsion = true;

          delete mario.onSpring;
        } else {
          dynamic.velocity.x = 0;
          dynamic.velocity.y = 0;
          dynamic.acceleration.x = 0;
          dynamic.acceleration.y = 0;
        }
      } else if (mario.climbing) {
        const prevFacing = mario.facing;
        if (i.leftPress && mario.facing === -1) {
          mario.facing = 1;
        }
        if (i.rightPress && mario.facing === 1) {
          mario.facing = -1;
        }
        dynamic.velocity.x = 0;
        dynamic.velocity.y = 0;
        dynamic.acceleration.x = 0;
        dynamic.acceleration.y = 0;
        if (i.climbUp) {
          dynamic.acceleration.y = -50 / dt;
        }
        if (i.climbDown) {
          dynamic.acceleration.y = 50 / dt;
        }

        // Prevent facing change to make you end up in static block
        // Somehow this works. Yes it sucks balls
        if (prevFacing !== mario.facing) {
          dynamic.velocity.x = e.size.x * mario.facing * 2 / dt;
          dynamic.velocity.y = dynamic.acceleration.y * dt;
          collider.set(e, dt);
          collider.computeBoundingBox();
          const bb = collider.boundingBox;

          for (const u of worldGrid.statics.findNear(bb.l, bb.t, bb.w, bb.h)) {
            collidee.set(u.userData);
            const [hit] = aabb.dynamicRectVsRect(collider, collidee);
            if (hit) mario.facing = prevFacing;
          }

          dynamic.velocity.x = 0;
          dynamic.velocity.y = 0;
        }

        e.position.x = mario.climbing.position.x - mario.facing * e.size.x / 2;
        e.gravity = 0;
        if (jumped) {
          delete mario.climbing;
          mario.climbingCooldown = 0.2;
          dynamic.acceleration.x = - mario.facing * 50 / dt;

          if (!i.climbDown) {
            mario.jumped = true;
            mario.jumping = true;
            mario.jumpCooldown = 5 / 60;
            mario.facing = mario.facing === -1 ? 1 : -1;
            dynamic.acceleration.y = - ((mario.jumpSpeed ?? 0) + dynamic.velocity.y) / dt;
          }
        }
      } else if (grounded) {
        mario.ducking = i.ducking && mario.big;
        mario.maxAirSpeed = undefined;
        mario.jumping = !!mario.jumpCooldown;
        mario.grounded = !mario.jumpCooldown;
        const running = !!i.run;
        const speedCloseToZero = speed < 1;

        mario.running = false;

        if (!ducking && side && (speedCloseToZero || side === dir)) {
          mario.skidDecel = false;
          mario.skidding = false;
          mario.facing = side;

          // Be sure to block movement if blocked
          const blocked = (side === 1 && rightBlocked) || (side === - 1 && leftBlocked);
          if (!blocked) {
            let acc = 0;

            // Moving towards current direction
            if (speed < config.minWalkSpeed) {
              acc = config.minWalkSpeed / dt;
            } else {
              acc = running ? config.runAccel : config.walkAccel;
            }
            const max = underwater ? config.maxWalkSpeedUnderwater : running ? config.maxRunSpeed : config.maxWalkSpeed;
            if (max === config.maxRunSpeed) mario.running = true;

            if (speed + acc * dt >= max) {
              acc = (max - speed) / dt
            }

            dynamic.acceleration.x += acc * side;
          }
        } else {
          const keepSkidDecel = mario.skidDecel && !mi.anyPressed;
          mario.skidDecel = !speedCloseToZero && keepSkidDecel;
          const wasSkidding = mario.skidding;
          mario.skidding = mario.skidding && !speedCloseToZero;

          // Be sure to block movement if blocked
          const blocked = (dir === 1 && rightBlocked) || (dir === -1 && leftBlocked);
          if (!blocked) {
            let decc = 0;
  
            // Decelerate
            if (ducking) {
              mario.skidDecel = false;
              mario.skidding = false;
              if (side && speedCloseToZero) mario.facing = side;
            } else if (side) {
              mario.skidDecel = true;
              mario.skidding = true;
              if (speed <= config.skidTurnaround) {
                mario.facing = side;
                mario.skidding = false;
              }
            } else {
              if (speed > config.skidTurnaround) {
                const prevFacing = mario.facing;
                mario.facing = (mario.skidding || !dir) ? mario.facing : dir < 0 ? -1 : 1;
                if (dir && dir !== prevFacing) {
                  mario.skidding = true;
                }
              } else if (wasSkidding && speedCloseToZero) {
                mario.facing = mario.facing === 1 ? - 1 : 1;
              }
            }
  
            decc = mario.skidDecel ? config.skidDecel : config.releaseDecel;
  
            if (speed <= decc * dt) {
              decc = speed / dt;
            }
  
            dynamic.acceleration.x += - decc * dir;
          }
        }
      } else {
        const wasSkidding = mario.skidding;

        if (wasSkidding && !jumped) {
          mario.facing = mario.facing === 1 ? -1 : 1;
        }

        mario.grounded = false;
        mario.skidding = false;
        mario.skidDecel = false;
        if (jumped || !mario.maxAirSpeed) {
          mario.maxAirSpeed = speed > config.maxWalkSpeed + Number.EPSILON ? config.maxRunSpeed : config.maxWalkSpeed;

          if (underwater) {
            mario.jumpSpeed =
              mario.whirlpool
              ? config.whirlpoolJump
              : mario.surface
              ? config.surfaceJump
              : config.swimJump;

            mario.jumpGravity =
              mario.whirlpool
              ? config.whirlpoolJumpGravity
              : config.swimJumpGravity;

            mario.fallGravity =
              mario.whirlpool
              ? config.whirlpoolFallGravity
              : config.swimFallGravity;
          } else {
            mario.jumpSpeed =
              speed < config.walkGravitySpeed
              ? config.walkJump
              : speed < config.midGravitySpeed
              ? config.midJump
              : config.runJump;

            mario.jumpGravity =
              speed < config.walkGravitySpeed
              ? config.walkJumpGravity
              : speed < config.midGravitySpeed
              ? config.midJumpGravity
              : config.runJumpGravity;

            mario.fallGravity =
              speed < config.walkGravitySpeed
              ? config.walkFallGravity
              : speed < config.midGravitySpeed
              ? config.midFallGravity
              : config.runFallGravity;
          }
        }

        e.gravity =
          i.jumping && dynamic.velocity.y <= 0
          ? mario.jumpGravity
          : mario.fallGravity;

        if (underwater) {
          mario.ducking = false;

          if (mario.surface) {
            e.gravity =
              i.jumping && dynamic.velocity.y <= 0
              ? config.surfaceJumpGravity
              : config.surfaceFallGravity;
          }

          if (e.gravity) e.gravity += 0x00100 * 60 * 60 / 0x01000;

          if (side && side !== mario.facing) {
            if (speed <= config.skidTurnaround) {
              mario.facing = side;
            }
          }
        }

        if (jumped) {
          mario.jumped = true;
          mario.jumping = true;
          mario.jumpCooldown = 5 / 60;
          dynamic.acceleration.y = - ((mario.jumpSpeed ?? 0) + dynamic.velocity.y) / dt;

          if (parameters?.conservationOfMomentum) {
            if (e.floorSpeed) {
              dynamic.acceleration.x += e.floorSpeed / dt;
            }
            if (e.floorSpeedY) {
              dynamic.acceleration.y += e.floorSpeedY / dt;
            }
          }
        } else {
          if (!mario.jumping) mario.ducking = false;
          if (mario.prevGrounded && speed > config.maxRunSpeed * 0.98) {
            dynamic.acceleration.y = - (20 + dynamic.velocity.y) / dt;
  
            if (parameters?.conservationOfMomentum) {
              if (e.floorSpeed) {
                dynamic.acceleration.x += e.floorSpeed / dt;
              }
              if (e.floorSpeedY) {
                dynamic.acceleration.y += e.floorSpeedY / dt;
              }
            }
          }
        }

        if (side) {
          let acc = 0;

          if (side === mario.facing) {
            acc = speed >= config.maxWalkSpeed ? config.jumpFastAccel : config.jumpSlowAccel;
          } else {
            acc = speed >= config.maxWalkSpeed ? config.jumpFastDecel : speed >= config.jumpBackwardsDecelThreshold ? config.jumpNormalDecel : config.jumpSlowDecel;
          }

          // Speed might or might not be capped when moving backwards in the air but we cap it here anyway
          if (dir === side) {
            if (speed + acc * dt >= mario.maxAirSpeed) {
              acc = (mario.maxAirSpeed - speed) / dt;
            }
          }

          dynamic.acceleration.x += acc * side;
        }
      }

      if (mario.shooting) {
        mario.shooting -= dt;
        if (mario.shooting <= 0) mario.shooting = 0;
      }
      if (mario.powerup === "fire" && mario.big && !mario.climbing) {
        if (i.attack && !mario.shooting && !ducking) {
          mario.shooting = 1/10;
          mario.shot = true;
        }
      }
    }
  }
}