import entities from "../entities";

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
      a.container.scale.x = mario.facing;

      if (mario.grounded) {
        a.loopsPerSecond = isIdle ? 0 : speed / 16;
      } else {
        a.loopsPerSecond = 0;
      }

      if (!mario.grounded && e.underwater) {
        a.loopsPerSecond = 3;
        if (mario.jumped) {
          if (mario.big) {
            if (mario.shooting) {
              a.setAnimation('bigShootIdle');
            } else {
              a.setAnimation('bigSwimStroke');
            }
          } else {
            a.setAnimation('smallSwimStroke');
          }
          mario.swimLoops = 2;
        } else {
          if (mario.swimLoops) {
            if (a.didLoop()) {
              mario.swimLoops -= 1;
            }
            if (mario.big) {
              if (mario.shooting) {
                a.setAnimation('bigShootIdle');
              } else {
                a.setAnimation('bigSwimStroke');
              }
            } else {
              a.setAnimation('smallSwimStroke');
            }
          } else {
            if (mario.big) {
              if (mario.shooting) {
                a.setAnimation('bigShootIdle');
              } else {
                a.setAnimation('bigSwim');
              }
            } else {
              a.setAnimation('smallSwim');
            }
          }
        }
      } else {
        mario.swimLoops = 0;
        if (mario.ducking || mario.forcedDucking) {
          if (mario.big) {
            a.setAnimation('bigDuck');
          } else {
            a.setAnimation('smallDie');
          }
        } else if (mario.jumping) {
          if (mario.big) {
            if (mario.shooting) {
              a.setAnimation('bigShootJump');
            } else {
              a.setAnimation('bigJump');
            }
          } else {
            a.setAnimation('smallJump');
          }
        } else if (mario.skidding) {
          if (mario.big) {
            if (mario.shooting) {
              a.setAnimation('bigShootSkid');
            } else {
              a.setAnimation('bigSkid');
            }
          } else {
            a.setAnimation('smallSkid');
          }
          a.container.scale.x = -mario.facing;
        } else {
          if (!isIdle || !mario.grounded) {
            const prev = a.getAnimation();
            if (!(prev === 'bigWalk' || prev === 'bigShootWalk' || prev === 'smallWalk')) {
              a.setFrame(0.8);
            }
            if (mario.big) {
              if (mario.shooting) {
                a.setAnimation('bigShootWalk');
              } else {
                a.setAnimation('bigWalk');
              }
            } else {
              a.setAnimation('smallWalk');
            }
          } else {
            if (mario.big) {
              if (mario.shooting) {
                a.setAnimation('bigShootIdle');
              } else {
                a.setAnimation('bigIdle');
              }
            } else {
              a.setAnimation('smallIdle');
            }
          }
        }
      }

      a.update(dt);
    }
  }
}