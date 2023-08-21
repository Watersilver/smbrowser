import entities from "../entities";

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

    if (config && mi && dynamic && mario) {
      const underwater = !!e.underwater;
      const i = mi.inputs;
      const jumped = (underwater || downBlocked) && i.jump && !mario.jumpCooldown;
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
      // Desirable if we want to get into tight spaces without first gathering momentum
      // Could be good for avoiding softlocks
      const wasDucking = mario.ducking;
      const ducking = mario.forcedDucking || mario.ducking || wasDucking;
      if (grounded) {
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
            dynamic.acceleration.y = - (10 + dynamic.velocity.y) / dt;
  
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
      if (mario.powerup === "fire" && mario.big) {
        if (i.attack && !mario.shooting && !ducking) {
          mario.shooting = 1/10;
          mario.shot = true;
        }
      }
    }
  }
}