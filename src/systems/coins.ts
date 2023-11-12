import { aabb } from "../engine";
import entities from "../entities";
import newCoinFromBlock from "../entityFactories/newCoinFromBlock";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

// Preload views
entities.view(['player']);

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
        if (e.player) e.player.coins++;
        newCoinFromBlock(uu.position.x, uu.position.y, 2);
      }
    }
  }
});

export default function coins(dt: number) {
  for (const e of entities.view(['player'])) {
    if (!e.player) continue;

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
          e.player.coins++;
        }
      }
    }

    while (e.player.coins > 99) {
      e.player.coins -= 100;
      e.player.gainedOneUp = true;
      e.player.lives++;
    }
  }
}