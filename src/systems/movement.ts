import { getSmb1Audio } from "../audio";
import { Display } from "../display";
import { aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

const e1 = new Collidable();
const e2 = new Collidable();

const audio = getSmb1Audio();

function *solids(c: Collidable) {
  yield* worldGrid.statics.findNear(c.l, c.t, c.w, c.h);
  yield* worldGrid.kinematics.findNear(c.l, c.t, c.w, c.h);
}

export default function movement(dt: number, display: Display) {
  for (const e of entities.view(['dynamic', 'movement', 'hits'])) {
    const d = e.dynamic;
    if (!d || !e.movement) continue;
    const h = e.movement.horizontal;

    e.movement.horizontalNow = false;

    if (h) {
      const wallhit = e.hits?.find(hit => Math.sign(hit.normal.x) === -Math.sign(h));
      let flip = !!wallhit;

      const grounded = !!e.touchingDown?.length;

      if (e.movement.dontFallOff && !wallhit && grounded) {
        flip = true;
        const direction = Math.sign(h);
        const padding = 3;
        e1.l = e.position.x + direction * (e.size.x * 0.5 + (direction === 1 ? 0 : padding));
        e1.t = e.position.y + e.size.y * 0.5;
        e1.w = padding;
        e1.h = 1;
        e1.pos.x = e1.l;
        e1.pos.y = e1.t;
        e1.size.x = e1.w;
        e1.size.y = e1.h;
        e1.dr.x = 0;
        e1.dr.y = 0;
        for (const u of solids(e1)) {
          if (u.userData === e) continue;
 
          e2.set(u.userData);

          if (aabb.rectVsRect(e1, e2)) {
            flip = false;
          }
        }
      }

      if (flip) {
        e.movement.horizontal = -h;
        e.movement.horizontalNow = true;

        if (wallhit) {
          e1.set(e);
          const {l, r} = display.getBoundingBox();
          const padding = r - l;
          e1.pos.x -= padding;
          e1.size.x += 2 * padding;
  
          if (e.enemy?.isMovingShell && display.overlapsRectBroad(e1)) audio.sounds.play('bump');
        }
      }
    }

    const b = e.movement.bounce;

    e.movement.bounceNow = false;

    const floorhit = e.hits?.find(hit => hit.normal.y < 0);

    if (b) {
      if (floorhit) {
        e.movement.bounceNow = true;

        if (b === true) {
          e.movement.bounce = -Math.sqrt(Math.abs(2 * (e.gravity ?? 0) * (e.position.y - e.positionStart.y)));
        }
      }
    }

    if (floorhit && e.movement.bounceStopHorizontal) {
      delete e.movement.bounceStopHorizontal;
      e.movement.horizontal = 0;
      e.movement.horizontalNow = true;
    }
  }

  for (const e of entities.view(['movement'])) {
    if (!e.movement || !e.movement.horizontal || !e.movement.flipEachOther) continue;

    e1.set(e);

    for (const u of worldGrid.dynamics.findNear(e1.l, e1.t, e1.w, e1.h)) {
      
      const uu = u.userData;

      if (!uu.movement || uu.movement.horizontal === undefined || !uu.movement.flipEachOther || uu === e) continue;

      e2.set(uu);

      if (aabb.rectVsRect(e1, e2)) {
        const eToU = Math.sign(uu.position.x - e.position.x);
        if (eToU) {
          e.movement.horizontal = -eToU * Math.abs(e.movement.horizontal);
          e.movement.horizontalNow = true;
          uu.movement.horizontal = eToU * Math.abs(uu.movement.horizontal);
          uu.movement.horizontalNow = true;
        }
      }
    }
  }
}
