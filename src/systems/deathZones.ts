import { Display } from "../display";
import { aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import zones from "../zones";

const rect = new Collidable();

function* deathables() {
  yield* entities.view(['dynamic']);
  yield* entities.view(['enemy', 'sensor']);
}

export default function deathZones(lowestY: number, display: Display) {
  for (const e of deathables()) {

    rect.set(e);

    const inDeathZone = zones.death.some(zone => aabb.rectVsRect(
      rect,
      {pos: {x: zone.x, y: zone.y}, size: {x: zone.w, y: zone.h}}
    ));

    if (e.position.y > lowestY || inDeathZone) {
      if (e.mario) {
        e.mario.dead = true;
        e.mario.big = false;
        e.star = false;
        delete e.mario.powerup;
      } else if (!inDeathZone) {
        entities.remove(e);
      }
    }
  }

  for (const e of entities.view(['deleteOutOfCam'])) {
    rect.set(e, undefined, undefined, true);
    if (!display.overlapsRectBroad(rect)) {
      entities.remove(e);
    }
  }
}