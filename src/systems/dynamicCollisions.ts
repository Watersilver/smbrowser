import { Vec2d } from "../engine";
import { rectVsRect } from "../engine/aabb";
import entities, { Entity } from "../entities";
import worldGrid from "../world-grid";

const collider = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};
const collidee = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};
const bb: {l: number; t: number; w: number; h: number;} = {l: 0, t: 0, w: 0, h: 0};

export default function dynamicCollisions() {
  for (const e of entities.view(['mario'])) {
    if (!e.mario) continue;
    const pos = e.position;
    const prevPos = e.positionPrev;
    const size = e.size;

    const l = prevPos.x - size.x * 0.5;
    const t = prevPos.y - size.y * 0.5;
    const w = size.x;
    const h = size.y;

    const dr = pos.sub(prevPos);

    collider.pos.x = pos.x - size.x * 0.5;
    collider.pos.y = pos.y - size.y * 0.5;
    collider.size.x = w;
    collider.size.y = h;
    collider.dr = dr;

    // Compute bounding box that contains rect both before and after movement
    bb.l = dr.x < 0 ? l + dr.x : l;
    bb.t = dr.y < 0 ? t + dr.y : t;
    bb.w = dr.x < 0 ? w - dr.x : w + dr.x;
    bb.h = dr.y < 0 ? h - dr.y : h + dr.y;

    // Collectibles
    for (const u of worldGrid.dynamics.findNear(bb.l, bb.t, bb.w, bb.h)) {
      const other = u.userData;
      if (!other.powerup && !other.oneUp && !other.star) continue;
      collidee.pos.x = other.position.x - other.size.x * 0.5;
      collidee.pos.y = other.position.y - other.size.y * 0.5;
      collidee.size.x = other.size.x;
      collidee.size.y = other.size.y;

      if (rectVsRect(collider, collidee)) {
        entities.remove(other)
        if (other.powerup) {
          if (e.mario.big) {
            e.mario.powerup = 'fire';
            e.mario.gainedPow = true;
          } else {
            e.mario.big = true;
            e.mario.changedSize = true;
          }
        } else if (other.oneUp) {
          e.mario.gainedOneUp = true;
          e.mario.lives++;
        } else if (other.star) {
          e.mario.star = 30;
        }
      }
    }
  }
}