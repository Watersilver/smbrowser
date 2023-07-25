import entities from "../entities";

export default function marioMovement(dt: number) {
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
    const upBlocked = !!e.touchingUp?.length;
    const leftBlocked = !!e.touchingLeft?.length;
    const rightBlocked = !!e.touchingRight?.length;
    const downBlocked = !!e.touchingDown?.length;

    if (config && mi && dynamic && mario) {
      const i = mi.inputs;
      const jumped = downBlocked && i.jump && !upBlocked && !mario.jumpCooldown;
      const grounded = downBlocked && !jumped && !mario.jumpCooldown;
      e.gravity = e.gravity || config.initFallGravity;

      if (mario.jumpCooldown) {
        mario.jumpCooldown -= dt;
        if (mario.jumpCooldown <= 0) mario.jumpCooldown = 0;
      }

      const dir = Math.sign(dynamic.velocity.x);
      let speed = Math.abs(dynamic.velocity.x);

      const side = i.left ? -1 : i.right ? 1 : 0;

      if (grounded) {
        mario.maxAirSpeed = undefined;
        mario.jumped = !!mario.jumpCooldown;
        const running = !!i.run;
        const underwater = !!e.underwater;
        const speedCloseToZero = speed < 1;

        const keepSkidDecel = mario.skidDecel && !mi.anyPressed;

        mario.running = false;
        mario.skidding = !speedCloseToZero && keepSkidDecel;
        mario.skidDecel = keepSkidDecel;

        if (side && (speedCloseToZero || side === dir)) {
          mario.facing = side;

          // Be sure to block movement if blocked
          const blocked = (side === 1 && rightBlocked) || (side === - 1 && leftBlocked);
          if (blocked) return;

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
            const ds = max + acc * dt - speed;
            acc = ds / dt;
          }

          dynamic.acceleration.x = acc * side;
        } else {
          // Be sure to block movement if blocked
          const blocked = (dir === 1 && rightBlocked) || (dir === -1 && leftBlocked);
          if (blocked) return;

          let decc = 0;

          // Skidding or Released
          if (side) {
            mario.skidDecel = true;
            mario.skidding = true;
            if (speed <= config.skidTurnaround) {
              mario.facing = side;
              mario.skidding = false;
            }
          }

          decc = mario.skidDecel ? config.skidDecel : config.releaseDecel;

          if (speed <= decc * dt) {
            decc = speed / dt;
          }

          dynamic.acceleration.x = - decc * dir;
        }
      } else {
        if (!mario.maxAirSpeed) {
          mario.maxAirSpeed = speed >= config.maxWalkSpeed ? config.maxRunSpeed : config.maxWalkSpeed;
        }

        if (jumped) {
          mario.jumpCooldown = 5 / 60;
          dynamic.acceleration.y = -222 / dt;
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
              const ds = mario.maxAirSpeed + acc * dt - speed;
              acc = ds / dt;
            }
          }

          dynamic.acceleration.x = acc * side;
        }
      }
    }
  }
}