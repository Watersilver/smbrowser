import { aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

const e1 = new Collidable();
const e2 = new Collidable();

export default function movement(dt: number) {
  for (const e of entities.view(['dynamic', 'movement', 'hits'])) {
    const d = e.dynamic;
    if (!d || !e.movement) continue;
    const h = e.movement.horizontal;

    e.movement.horizontalNow = false;

    if (h) {
      const wallhit = e.hits?.find(hit => Math.sign(hit.normal.x) === -Math.sign(h));
      if (wallhit) {
        e.movement.horizontal = -h;
        e.movement.horizontalNow = true;
      }
    }

    const b = e.movement.bounce;

    e.movement.bounceNow = false;

    if (b) {
      const floorhit = e.hits?.find(hit => hit.normal.y < 0);
      if (floorhit) {
        e.movement.bounceNow = true;
      }
    }
  }

  for (const e of entities.view(['movement'])) {
    if (!e.movement || !e.movement.horizontal || !e.movement.flipEachOther) continue;

    e1.set(e);
    
    for (const u of worldGrid.dynamics.findNear(e1.l, e1.t, e1.w, e1.h)) {
      
      const uu = u.userData;

      if (!uu.movement || !uu.movement.horizontal || !uu.movement.flipEachOther || uu === e) continue;

      // if (e.movement.horizontal * uu.movement.horizontal > 0) continue;

      // if (e.movement.horizontal * (e.position.x - uu.position.x) > 0) continue;

      e2.set(uu);

      if (aabb.rectVsRect(e1, e2)) {
        // e.movement.horizontal *= -1;
        // e.movement.horizontalNow = true;
        // uu.movement.horizontal *= -1;
        // uu.movement.horizontalNow = true;

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
