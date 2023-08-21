import fireMarioFilter, { fireMarioFilterUniforms } from "../Filters/fire-mario";
import entities from "../entities";
import { GlowFilter, MultiColorReplaceFilter } from "pixi-filters";

const fmfRedStart = fireMarioFilterUniforms.red;
let t = 0;
let redIntensityMod = 0;
const gf = new GlowFilter();
gf.color = 0xff0000;
gf.outerStrength = 1;
gf.innerStrength = 1;
gf.alpha = 0.5;
const fireMario = [
  fireMarioFilter,
  gf,
];

let t2 = 0;
const sf = new MultiColorReplaceFilter(
  [
    [0xb53120, 0xff0000],
    [0xea9e22, 0x00ff00],
    [0x6b6d00, 0x0000ff],
  ],
  0.1
);
const starMario = [
  sf
]

export default function renderSmb1Mario(dt: number) {

  t = (t + dt * Math.PI) % (Math.PI * 2);
  redIntensityMod = Math.sin(t) * 0.2;

  fireMarioFilterUniforms.red = redIntensityMod * fmfRedStart + fmfRedStart;

  const prevT2 = t2;
  t2 = (t + dt) % 0.8;
  if (prevT2 > t2) {
    for (const col of sf.replacements) {
      col[1] = Math.random() * 0xff * 0x10000 + Math.random() * 0xff * 0x100 + Math.random() * 0xff;
    }
    sf.refresh();
  }

  for (const e of entities.view(['mario', 'smb1MarioAnimations'])) {
    const a = e.smb1MarioAnimations;
    const mario = e.mario;
    const v = e.dynamic?.velocity;
    const accel = e.dynamic?.acceleration;
    const speed = v ? Math.abs(v.x) : 0;
    const accelMagn = accel ? Math.abs(accel.x) : 0;
    const isIdle = speed < Number.EPSILON * 2 && accelMagn < Number.EPSILON * 2;
    if (a && mario) {

      // Determine filters
      if (mario.star) {
        if (e.filters !== starMario) {
          e.filters = starMario;
        }
      } else if (mario.powerup === 'fire') {
        if (e.filters !== fireMario) {
          e.filters = fireMario;
        }
      } else if (e.filters) {
        delete e.filters;
      }

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