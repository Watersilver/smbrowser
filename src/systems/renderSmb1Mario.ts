import fireMarioFilter, { fireMarioFilterUniforms } from "../Filters/fire-mario";
import entities from "../entities";
import { GlowFilter, MultiColorReplaceFilter } from "pixi-filters";
import smb1Sprites from "../sprites/smb1";
import display from "../display";
import hslToRgb from "../utils/hslToRgb";
import { getSmb1Audio } from "../audio";

// Preload views
entities.view(['mario', 'smb1MarioAnimations']);

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
  gf
];

let t2 = 0;
const sf = new MultiColorReplaceFilter(
  [
    [0xb53120, 0xff0000], // hat
    [0xea9e22, 0x00ff00], // skin
    [0x6b6d00, 0x0000ff], // hair
  ],
  0.1
);
const sg = new GlowFilter();
sg.alpha = 0.9;
const starMario = [
  sf,
  sg
]

const fsg = new GlowFilter();
fsg.color = 0xff0000;
fsg.innerStrength = 1;
const bothMario = [
  sf,
  fsg
]

// Do this weid ass thing here because for some reason
// these filters cause some stutter first time they're
// applied.
// Apply them here first so stutter is during loading.
const m = smb1Sprites.getFactory('mario').new();
m.container.filters = fireMario;
display.add(m.container);
setTimeout(() => {
  m.container.filters = starMario;
  setTimeout(() => {
    m.container.filters = bothMario;
    setTimeout(() => {
      m.container.removeFromParent();
    });
  });
});

let maxStar = 1;
let prevStar: number | undefined = undefined;
const audio = getSmb1Audio();

export default function renderSmb1Mario(dt: number) {

  t = (t + dt * Math.PI) % (Math.PI * 2);
  redIntensityMod = Math.sin(t) * 0.2;

  fireMarioFilterUniforms.red = redIntensityMod * fmfRedStart + fmfRedStart;

  const prevT2 = t2;
  t2 = (t + dt) % 0.8;
  if (prevT2 > t2) {
    let i = 0;
    for (const col of sf.replacements) {
      col[1] = hslToRgb(Math.random(), (3 - i) / 3, (3 - i) / 3.5).map(v => v / 255);
      i++;
    }
    sf.refresh();
  }

  for (const e of entities.view(['mario', 'smb1MarioAnimations'])) {

    if (e.mario?.star) {
      if (!prevStar) {
        maxStar = e.mario.star;
        audio.sounds.play('star');
      }
      sg.outerStrength = 4 * e.mario.star / maxStar;
      fsg.outerStrength = 4 * e.mario.star / maxStar;
      fsg.innerStrength = e.mario.star / maxStar;
    }
    prevStar = e.mario?.star;

    const a = e.smb1MarioAnimations;
    const mario = e.mario;
    const v = e.dynamic?.velocity;
    const accel = e.dynamic?.acceleration;
    const speed = v ? Math.abs(v.x) : (e.mario?.inPipe?.nonIdle ? 50 : 0);
    const accelMagn = accel ? Math.abs(accel.x) : 0;
    const isIdle = speed < Number.EPSILON * 2 && accelMagn < Number.EPSILON * 2;
    if (a && mario && !mario.cutscene) {

      // Make mario smaller to make him fin in pipe
      if (mario.inPipe) {
        a.container.scale.set(0.9);
      } else {
        a.container.scale.set(1);
      }

      // Determine filters
      if (mario.star && mario.powerup === 'fire') {
        if (e.filters !== bothMario) {
          e.filters = bothMario;
        }
      } else if (mario.star) {
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

      if (mario.onSpring) {
        a.container.position.y += Math.sin(mario.onSpring.spring.spring?.progress ?? 0) * 16;
      }

      if (mario.climbing) {
        if (e.positionPrev.y !== e.position.y) {
          a.loopsPerSecond = 3;
        } else {
          a.loopsPerSecond = 0;
        }
        if (mario.big) {
          a.setAnimation('bigClimb');
        } else {
          a.setAnimation('smallClimb');
        }
      } else if (!mario.grounded && e.underwater) {
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

      if (e.iframesSecs) {
        a.container.alpha = 0.5;
      } else {
        a.container.alpha = 1;
      }
    } else if (a && mario?.cutscene) {
      a.container.alpha = 1;
      a.update(dt);
    }
  }
}