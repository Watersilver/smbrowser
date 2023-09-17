import { Display } from "../display";
import entities from "../entities";
import Collidable from "../utils/collidable";

const rect = new Collidable();

export default function deathZones(lowestY: number, display: Display) {
  for (const e of entities.view(['dynamic'])) {
    if (e.position.y > lowestY) {
      if (e.mario) {
        e.mario.dead = true;
      } else {
        entities.remove(e);
      }
    }
  }

  for (const e of entities.view(['deleteOutOfCam'])) {
    rect.set(e);
    if (!display.overlapsRectBroad(rect)) {
      entities.remove(e);
    }
  }
}