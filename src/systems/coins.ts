import { aabb } from "../engine";
import entities from "../entities";
import newCoinFromBlock from "../entityFactories/newCoinFromBlock";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

const collider = new Collidable();
const collidee = new Collidable();

entities.onPropChange('bonked', e => {
  if (!e.bonked) return;
  collider.set(e);
  collider.pos.y -= 16;
  collider.t -= 16;
  collider.w--;
  collider.h--;
  collider.size.x--;
  collider.size.y--;
  const bb = collider.computeBoundingBox();
  for (const u of worldGrid.sensors.findNear(bb.l, bb.t, bb.w, bb.h)) {
    const uu = u.userData;
    if (uu.coin) {
      collidee.set(uu);

      if (aabb.rectVsRect(collider, collidee)) {
        delete uu.coin;
        entities.remove(uu);
        if (e.mario) e.mario.coins++;
        newCoinFromBlock(uu.position.x, uu.position.y, 2);
      }
    }
  }
});

export default function coins(dt: number) {
  for (const e of entities.view(['mario'])) {
    collider.set(e, dt);
    const bb = collider.computeBoundingBox();
    for (const u of worldGrid.sensors.findNear(bb.l, bb.t, bb.w, bb.h)) {
      const uu = u.userData;
      if (uu.coin) {
        collidee.set(uu);

        if (aabb.rectVsRect(collider, collidee)) {
          uu.coinGotCollected = true;
          delete uu.coin;
          entities.remove(uu);
          if (e.mario) e.mario.coins++;
        }
      }
    }
  }
}