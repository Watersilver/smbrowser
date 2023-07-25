import { Vec2d } from "../engine";
import { dynamicRectVsRect } from "../engine/aabb";
import entities from "../entities";
import worldGrid from "../world-grid";

const collider = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};
const collidee = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0)};

const checkSide = (check: "touchingDown" | "touchingUp" | "touchingRight" | "touchingLeft") => {
  collider.dr.x = check === "touchingLeft" ? -.1 : check === "touchingRight" ? .1 : 0;
  collider.dr.y = check === "touchingUp" ? -.1 : check === "touchingDown" ? .1 : 0;
  for (const ent of entities.view([check])) {
    const c = ent[check];
    if (!c) continue;

    collider.pos.x = ent.position.x - 0.5 * ent.size.x;
    collider.pos.y = ent.position.y - 0.5 * ent.size.y;
    collider.size.x = ent.size.x;
    collider.size.y = ent.size.y;

    for (const u of worldGrid.statics.findNear(collider.pos.x + collider.dr.x, collider.pos.y + collider.dr.y, collider.size.x, collider.size.y)) {
      if (u.userData === ent) continue;

      collidee.pos.x = u.l;
      collidee.pos.y = u.t;
      collidee.size.x = u.w;
      collidee.size.y = u.h;
      const [hit] = dynamicRectVsRect(collider, collidee);

      if (hit) {
        c.push(u.userData);
      }
    }

    for (const u of worldGrid.kinematics.findNear(collider.pos.x + collider.dr.x, collider.pos.y + collider.dr.y, collider.size.x, collider.size.y)) {
      if (u.userData === ent) continue;

      collidee.pos.x = u.l;
      collidee.pos.y = u.t;
      collidee.size.x = u.w;
      collidee.size.y = u.h;
      const [hit] = dynamicRectVsRect(collider, collidee);

      if (hit) {
        c.push(u.userData);
      }
    }
  }
}

export default function detectTouching() {
  checkSide('touchingUp');
  checkSide('touchingRight');
  checkSide('touchingDown');
  checkSide('touchingLeft');
}