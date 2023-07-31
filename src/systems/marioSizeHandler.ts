import { Vec2d } from "../engine";
import { dynamicRectVsRect } from "../engine/aabb";
import entities from "../entities";
import worldGrid from "../world-grid";

const collider = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, -16)};
const collidee = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0)};

export default function marioSizeHandler() {
  for (const ent of entities.view(['mario', 'dynamic'])) {
    const mario = ent.mario;
    const d = ent.dynamic;

    if (mario && d) {
      mario.forcedDucking = false;
      if (mario.big && !mario.ducking) {
        if (ent.size.y === 32) continue;

        const l = ent.position.x - ent.size.x * 0.5;
        const t = ent.position.y - ent.size.y * 0.5;
        const w = ent.size.x;
        const h = ent.size.y;

        collider.pos.x = l;
        collider.pos.y = t;
        collider.size.x = w;
        collider.size.y = h;
        collider.dr.y -= 16;

        let clear = true;

        for (const u of worldGrid.statics.findNear(l, t, w, h)) {
          if (u.userData === ent) continue;

          collidee.pos.x = u.userData.position.x - u.userData.size.x * 0.5;
          collidee.pos.y = u.userData.position.y - u.userData.size.y * 0.5;
          collidee.size.x = u.userData.size.x;
          collidee.size.y = u.userData.size.y;

          const [hit, col] = dynamicRectVsRect(collider, collidee);

          clear = clear && (!hit || col.normal.y !== 1);
        }

        for (const u of worldGrid.kinematics.findNear(l, t, w, h)) {
          if (u.userData === ent) continue;

          collidee.pos.x = u.userData.position.x - u.userData.size.x * 0.5;
          collidee.pos.y = u.userData.position.y - u.userData.size.y * 0.5;
          collidee.size.x = u.userData.size.x;
          collidee.size.y = u.userData.size.y;

          const [hit, col] = dynamicRectVsRect(collider, collidee);

          clear = clear && (!hit || col.normal.y !== 1);
        }

        if (clear) {
          const prevSy = ent.size.y;
          ent.size.y = 32;
          const diff = prevSy - ent.size.y;
          if (diff) {
            ent.position.y += diff / 2;
          }
        } else {
          mario.forcedDucking = true;
        }
      } else {
        if (ent.size.y === 16) continue;
        const prevSy = ent.size.y;
        ent.size.y = 16;
        const diff = prevSy - ent.size.y;
        if (diff) {
          ent.position.y += diff / 2;
        }
      }
    }
  }
}