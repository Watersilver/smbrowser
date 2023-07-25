import { Vec2d } from "../engine";
import entities, { Entity } from "../entities";

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
    const grounded = !!e.touchingDown?.length;

    if (config && mi && dynamic && mario) {
      const i = mi.inputs;
      if (grounded) {
        const side = i.left ? -1 : i.right ? 1 : 0;
        const running = !!i.run;
        const underwater = !!e.underwater;

        const dir = Math.sign(dynamic.velocity.x);
        let speed = Math.abs(dynamic.velocity.x);
        const speedCloseToZero = speed < 1;

        const keepSkidDecel = mario.skidDecel && !mi.anyPressed;

        mario.running = false;
        mario.skidding = !speedCloseToZero && keepSkidDecel;
        mario.skidDecel = keepSkidDecel;

        if (side && (speedCloseToZero || side === dir)) {
          mario.facing = side;

          // Be sure to block movement if blocked
          const blocked = (side === 1 && rightBlocked) || leftBlocked;
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
      }
    }
  }
}