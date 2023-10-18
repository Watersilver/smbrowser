import { aabb } from "../engine";
import { Vec2dData } from "../engine/Vec2d";
import entities from "../entities";
import { Zone } from "../types";
import Collidable from "../utils/collidable";

const c1 = new Collidable();
const c2 = new Collidable();

export default function checkpoints(list: Set<(Zone & {spawnpoint: Vec2dData})>) {
  for (const checkpoint of list) {
    c1.setToZone(checkpoint);
    const m = entities.view(['mario']).find(m => {
      c2.set(m);
      return aabb.rectVsRect(c1, c2);
    });
    if (m && m.mario) {
      m.mario.respawnPoint = {...checkpoint.spawnpoint};
      list.delete(checkpoint);
      break;
    }
  }
}