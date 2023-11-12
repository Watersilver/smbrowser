import { Input, Vec2d, aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";
import zones from "../zones";

// Preload views
entities.view(['pipe']);
entities.view(['mario']);

const collider = new Collidable();
const collidee = new Collidable();
const noPipeZone = new Collidable();

const initSpeed = 200;
const pipeEnterExitSpeed = 100;
const pipeSpeed = 444;

export default function pipes(input: Input, dt: number) {
  for (const e of entities.view(['pipe'])) {
    if (!e.pipe) continue;
    collider.set(e);
    collider.computeBoundingBox();
    const bb = collider.boundingBox;

    for (const u of worldGrid.dynamics.findNear(bb.l, bb.t, bb.w, bb.h)) {
      const uu = u.userData;
      if (uu.mario) {
        collidee.set(u.userData);
        if (aabb.rectVsRect(collider, collidee)) {
          if (
            (e.pipe.from === 'u' && uu.touchingDown?.length && (input.isPressed('ArrowDown') || input.isHeld('ArrowDown')))
            || (e.pipe.from === 'l' && uu.touchingLeft?.length && (input.isPressed('ArrowLeft') || input.isHeld('ArrowLeft')))
            || (e.pipe.from === 'r' && uu.touchingRight?.length && (input.isPressed('ArrowRight') || input.isHeld('ArrowRight')))
            || (e.pipe.from === 'd' && uu.touchingDown?.length && (input.isPressed('ArrowDown') || input.isHeld('ArrowDown')))
          ) {
            if (zones.medusaHead.some(np => aabb.pointVsRect(uu.position, noPipeZone.setToZone(np)))) {
              continue;
            }
            delete uu.dynamic;
            uu.mario.inPipe = {
              path: e.pipe.path,
              from: e.pipe.from,
              to: e.pipe.to,
              zIndex: e.smb1MarioAnimations?.container.zIndex ?? 1
            }
            if (uu.smb1MarioAnimations) uu.smb1MarioAnimations.container.zIndex = -10;
          }
        }
      }
    }
  }

  for (const e of entities.view(['mario'])) {
    const p = e.mario?.inPipe;
    if (p) {
      if (p.iTarget === undefined) {
        p.iTarget = 0;
        p.started = true;
      } else {
        p.started = false;
      }

      const f = p.path[0];
      const first = f ? {
        x: f[0],
        y: f[1]
      } : null;
      const l = p.path.at(-1);
      const last = l ? {
        x: l[0],
        y: l[1]
      } : null;

      if (e.smb1MarioAnimations && e.mario) {
        const visible =
          (first && p.iTarget < 2 && e.position.sub(first).length() < 32)
          || (last && p.iTarget > p.path.length - 2 && e.position.sub(last).length() < 32);

        e.smb1MarioAnimations.container.visible = visible ?? false;

        if (!visible) {
          if (p.to === 'd' || p.to === 'u') {
            e.mario.jumping = true;
          } else if (p.to === 'l' || p.to === 'r') {
            e.mario.jumping = false;
            if (e.mario.inPipe) e.mario.inPipe.nonIdle = true;

            if (p.to === 'l') {
              e.mario.facing = -1;
            } else {
              e.mario.facing = 1;
            }
          }
        }
      }

      const t = p.path[p.iTarget];
      const target = t ? {
        x: t[0],
        y: t[1]
      } : null;

      if (target) {
        const before = e.position.sub(target);
        if (before.length() < 1) {
          p.iTarget++;
        } else {
          const speed = p.iTarget === 0 ? initSpeed : p.iTarget === 1 || p.iTarget === p.path.length - 1 ? pipeEnterExitSpeed : pipeSpeed;
          const dr = e.position.sub(target).unit().mul(-speed * dt);
          e.position.x += dr.x;
          e.position.y += dr.y;

          const after = e.position.sub(target);

          // We went beyond target
          if (after.dot(before) < 0) {
            p.iTarget++;
          }

          if (e.smb1MarioAnimations) {
            e.smb1MarioAnimations.container.x = e.position.x;
            e.smb1MarioAnimations.container.y = e.position.y;
          }
        }
      } else {

        p.exiting = p.exiting ?? {
          x: p.path.at(-1)?.[0] ?? e.position.x,
          y: p.path.at(-1)?.[1] ?? e.position.y
        };

        const dr = p.to === 'd'
          ? {x: 0, y: pipeEnterExitSpeed * dt}
          : p.to === 'u'
          ? {x: 0, y: -pipeEnterExitSpeed * dt}
          : p.to === 'r'
          ? {x: pipeEnterExitSpeed * dt, y: 0}
          : {x: -pipeEnterExitSpeed * dt, y: 0};

        e.position.x += dr.x;
        e.position.y += dr.y;

        if (e.smb1MarioAnimations) {
          e.smb1MarioAnimations.container.x = e.position.x;
          e.smb1MarioAnimations.container.y = e.position.y;
        }

        let exitDist = p.to === 'd' || p.to === 'u' ? e.size.y * 0.55 : e.size.x * 0.55;

        if (e.position.sub(p.exiting).length() > exitDist) {
          if (e.smb1MarioAnimations) {
            if (p.zIndex !== undefined) {
              e.smb1MarioAnimations.container.zIndex = p.zIndex;
            }
            e.smb1MarioAnimations.container.visible = true;
          }
          delete e.mario?.inPipe;
          e.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
        }
      }
    }
  }
}