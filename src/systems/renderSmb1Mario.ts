import display from "../display";
import entities from "../entities";

entities.onPropChange('smb1MarioAnimations', (e, a) => {
  if (a?.container.parent) a?.container.removeFromParent();
  if (e.smb1MarioAnimations?.container) display.add(e.smb1MarioAnimations.container);
});

entities.onRemoving(['smb1MarioAnimations'], e => {
  if (e.smb1MarioAnimations?.container.parent) {
    e.smb1MarioAnimations?.container.removeFromParent();
  }
});

export default function renderSmb1Mario(dt: number) {
  for (const e of entities.view(['mario', 'smb1MarioAnimations'])) {
    const a = e.smb1MarioAnimations;
    const mario = e.mario;
    const v = e.dynamic?.velocity;
    const accel = e.dynamic?.acceleration;
    const speed = v ? Math.abs(v.x) : 0;
    const accelMagn = accel ? Math.abs(accel.x) : 0;
    const isIdle = speed < Number.EPSILON * 2 && accelMagn < Number.EPSILON * 2;
    if (a && mario) {
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
      const prevFacing = a.container.scale.x;
      a.container.scale.x = mario.facing;

      if (mario.grounded) {
        a.loopsPerSecond = isIdle ? 0 : speed / 16;
      } else {
        a.loopsPerSecond = 0;
      }

      if (!mario.grounded && e.underwater) {
        a.loopsPerSecond = 3;
        if (mario.jumped) {
          a.setAnimation('smallSwimStroke');
          mario.swimLoops = 2;
        } else {
          if (mario.swimLoops) {
            if (a.didLoop()) {
              mario.swimLoops -= 1;
            }
          } else {
            a.setAnimation('smallSwim');
          }
        }
      } else {
        mario.swimLoops = 0;
        if (mario.ducking || mario.forcedDucking) {
          a.setAnimation('bigDuck');
        } else if (mario.jumping) {
          if (mario.big) {
            a.setAnimation('bigJump');
          } else {
            a.setAnimation('smallJump');
          }
        } else if (mario.skidding) {
          if (mario.big) {
            a.setAnimation('bigSkid');
          } else {
            a.setAnimation('smallSkid');
          }
          a.container.scale.x = -mario.facing;
        } else {
          if (!isIdle || !mario.grounded) {
            const changed = mario.big ? a.setAnimation('bigWalk') : a.setAnimation('smallWalk');
            if (changed) a.setFrame(0.8);
          } else {
            if (mario.big) {
              a.setAnimation('bigIdle');
            } else {
              a.setAnimation('smallIdle');
            }
          }
        }
      }

      a.update(dt);
    }

    display.setScale(3);
    display.setCenter(e.position.x, e.position.y);
  }
}