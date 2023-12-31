import { Display } from "../display";
import { aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import zones from "../zones";

// Preload views
entities.view(['dynamic']);
entities.view(['enemy', 'sensor']);
entities.view(['deleteOutOfCam']);

const rect = new Collidable();

function* killables() {
  yield* entities.view(['dynamic']);
  yield* entities.view(['enemy', 'sensor']);
}

export default function deathZones(lowestY: number, display: Display) {
  for (const e of killables()) {

    rect.set(e);

    const inDeathZone = zones.death.some(zone => aabb.rectVsRect(
      rect,
      {pos: {x: zone.x, y: zone.y}, size: {x: zone.w, y: zone.h}}
    ));

    if (e.position.y > lowestY || inDeathZone) {
      if (e.surviveDeathzone) continue;
      if (e.mario) {
        // Don't kill if in pipe or jumping of spring
        if (!e.mario.inPipe && !e.mario.trampolinePropulsion) {
          e.mario.dead = true;
          e.mario.big = false;
          e.star = false;
          delete e.mario.powerup;
        }
      } else {
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