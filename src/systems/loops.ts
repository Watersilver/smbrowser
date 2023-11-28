import { getSmb1Audio } from "../audio";
import { aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import zones from "../zones";

// Preload views
entities.view(['mario']);

const c1 = new Collidable();
const c2 = new Collidable();
const a = getSmb1Audio();

export default function loops() {
  for (const e of entities.view(['mario'])) {
    if (!e.dynamic) continue;
    if (e.dynamic.velocity.x <= 0) continue;
    c1.set(e);
    const inside = zones.loop.filter(z => aabb.rectVsRect(c1, c2.setToZone(z))).sort((a,b) => a.x - b.x);

    if (inside.length > 1) {
      e.position.x = inside[0]?.x ?? e.position.x;
      a.sounds.play('buzzer');
    }
  }
}