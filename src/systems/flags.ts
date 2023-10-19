import { getSmb1Audio } from "../audio";
import display, { Display } from "../display";
import { Vec2d, aabb } from "../engine";
import entities, { Entity } from "../entities";
import newBrokenBrick from "../entityFactories/newBrokenBrick";
import newClutter from "../entityFactories/newClutter";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

const audio = getSmb1Audio();

const flagpole = new Collidable();
const mario = new Collidable();

export default function flags(dt: number, display: Display) {
  for (const e of entities.view(['flagpole'])) {
    const f = e.flagpole;

    if (!f) continue;

    if (!f.flag) {
      const flag = newClutter(e.position.x - 8, e.position.y - e.size.y + 16 + 9, {type: 'object', frame: 'evilflag'});
      f.flag = flag;
    }

    if (!f.mario) {
      // Detect initial touch
      for (const m of entities.view(['mario'])) {
        if (!m.mario) continue;
        mario.set(m, dt);
        flagpole.set(e);
        // Flagpole is printed with offset, so compensate here
        flagpole.pos.y = flagpole.pos.y - flagpole.size.y * 0.5;
        if (aabb.rectVsRect(mario, flagpole)) {
          f.mario = m;
          m.mario.cutscene = true;
          delete m.dynamic;
          m.moving = true;
          if (m.smb1MarioAnimations) {
            m.smb1MarioAnimations.setAnimation(m.mario.big ? 'bigClimb' : 'smallClimb');
            m.smb1MarioAnimations.loopsPerSecond = 4;
          }
          m.position.x = e.position.x - 8;
          if (!m.mario.flags) {
            m.mario.flags = 0;

            audio.sounds.play('flagpole');
            f.fall = {};
            f.flag.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
            f.flag.goThrougWalls = true;
            f.flag.gravity = 200;
          }

          m.mario.flags++;
        }
      }
    } else if (f.fall) {
      const manim = f.mario.smb1MarioAnimations;
      if (!f.fall.marioclimb) {
        const t = e.position.y - e.size.y + 16 + 7;
        const yprevmario = f.mario.position.y;
        const comparisonPrev = t > yprevmario;

        if (t > yprevmario) {
          f.mario.position.y += dt * 70;
        } else {
          f.mario.position.y -= dt * 70;
        }

        if (t > f.mario.position.y !== comparisonPrev) {
          f.mario.position.y = t;
          f.fall.marioclimb = true;
          f.fall.timebeforecrash = 1;
          if (manim) {
            manim.loopsPerSecond = 0;
            manim.setFrame(0);
            manim.container.scale.x = -manim.container.scale.x;
            f.mario.position.x += 16;
          }
        }
      } else if (f.fall.timebeforecrash) {
        f.fall.timebeforecrash -= dt;
        if (f.fall.timebeforecrash <= 0) {
          audio.sounds.play('bowserfalls');
          delete f.fall.timebeforecrash;
          f.fall.angvel = 0.5;
          f.fall.angle = 0;
        }
      } else if (
        typeof f.fall.angvel === 'number'
        && typeof f.fall.angle === 'number'
      ) {
        if (f.fall.angle > 0.4) f.fall.angvel = 4;
        f.fall.angle += f.fall.angvel * dt;
        if (f.fall.angle > Math.PI / 2) {
          f.fall.angle = Math.PI / 2;
          delete f.fall.angvel;

          f.mario.dynamic = {velocity: new Vec2d(20, -150), acceleration: new Vec2d(0, 0)};
          f.mario.smb1MarioAnimations?.setAnimation('smallDie');
          f.mario.angVel = 360 * (Math.random() + 1) * (Math.random() < 0.5 ? 1 : -1);
          f.mario.gravity = 100;
          e.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
          e.gravity = 100;
          audio.sounds.play('mariodieend');
          audio.sounds.play('breakblock');
          audio.sounds.play('bowserfire');
          e.surviveDeathzone = true;
          if (f.mario.mario) {
            if (f.mario.mario.big) {
              f.mario.mario.big = false;
              audio.sounds.play('pipe');
            }
          }

          let castlePos: Vec2d | null = null;
          let b: Entity;
          for (const clutter of worldGrid.grid.findNear(
            e.position.x,
            e.position.y - 100,
            f.mario.position.x - e.position.x,
            200
          )) {
            const uu = clutter.userData;
            if (uu.smb1TilesSprites) {
              const frame = uu.smb1TilesSprites.getFrame();
              if (frame === 'clutterBrownCastleSmall') {
                const x = uu.smb1TilesSprites.container.position.x;
                const y = uu.smb1TilesSprites.container.position.y;

                for (let j = -4; j <= 0; j++) {
                  const imax = j < -2 ? 1 : 2;
                  for (let i = -imax; i <= imax; i++) {
                    b = newBrokenBrick(x + i * 16 - 4, y + j * 16 - 4, 'brokenBrick1', -1);
                    if (b.smb1TilesSprites) b.smb1TilesSprites.container.zIndex = 100;
                    b = newBrokenBrick(x + i * 16 - 4, y + j * 16 + 4, 'brokenBrick1', -1, -66);
                    if (b.smb1TilesSprites) b.smb1TilesSprites.container.zIndex = 100;
                    b = newBrokenBrick(x + i * 16 + 4, y + j * 16 - 4, 'brokenBrick1', +1);
                    if (b.smb1TilesSprites) b.smb1TilesSprites.container.zIndex = 100;
                    b = newBrokenBrick(x + i * 16 + 4, y + j * 16 + 4, 'brokenBrick1', +1, -66);
                    if (b.smb1TilesSprites) b.smb1TilesSprites.container.zIndex = 100;
                  }
                }

                castlePos = new Vec2d(x, y);

                entities.remove(uu);
                break;
              }
            }
          }

          if (castlePos) for (const floor of worldGrid.statics.findNear(
            e.position.x,
            e.position.y,
            f.mario.position.x - e.position.x,
            200
          )) {
            if (castlePos.distance(floor.userData.position) < 32) {
              const p = floor.userData.position;
              b = newBrokenBrick(p.x - 4, p.y - 4, 'brokenBrick1', -1);
              if (b.smb1TilesSprites) b.smb1TilesSprites.container.zIndex = 100;
              b = newBrokenBrick(p.x - 4, p.y + 4, 'brokenBrick1', -1, -66);
              if (b.smb1TilesSprites) b.smb1TilesSprites.container.zIndex = 100;
              b = newBrokenBrick(p.x + 4, p.y - 4, 'brokenBrick1', +1);
              if (b.smb1TilesSprites) b.smb1TilesSprites.container.zIndex = 100;
              b = newBrokenBrick(p.x + 4, p.y + 4, 'brokenBrick1', +1, -66);
              if (b.smb1TilesSprites) b.smb1TilesSprites.container.zIndex = 100;
              entities.remove(floor.userData);
            }
          }
        }

        if (e.smb1TilesSprites) {
          e.smb1TilesSprites.container.rotation = f.fall.angle;

          if (e.smb1TilesSprites.sprite.anchor.y !== 1) {
            e.smb1TilesSprites.sprite.anchor.y = 1;
            e.position.y += 8;
            e.moving = true;
          }

          const newPos = new Vec2d(-e.size.y + 16 + 7 - 8, f.fall.angle + Math.PI / 2).toCartesian();
          const offset = new Vec2d(8, f.fall.angle).toCartesian();
          f.mario.position.x = e.position.x + newPos.x + offset.x;
          f.mario.position.y = e.position.y + newPos.y + offset.y;

          if (f.mario.smb1MarioAnimations) {
            f.mario.smb1MarioAnimations.container.rotation = f.fall.angle;
          }
        }
      } else {
        if (f.mario.dynamic && f.mario.dynamic.velocity.y >= 0) {
          f.mario.gravity = 300;
          if (f.mario.hits?.length) {
            if (f.mario.mario) {
              delete f.mario.mario.cutscene;
            }
            e.surviveDeathzone = false;
            if (f.mario.smb1MarioAnimations) {
              f.mario.smb1MarioAnimations.container.rotation = 0;
            }
            delete f.mario.angVel;
            delete f.mario;
          }
        }
      }
    }
  }
}