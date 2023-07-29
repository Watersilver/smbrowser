import { getSmb1Audio } from "../audio";
import entities from "../entities";

const audio = getSmb1Audio();

export default function marioSmb1Sounds() {
  for (const e of entities.view(['mario'])) {
    const m = e.mario;
    if (m) {
      if (m.jumped) audio.sounds.play('jumpSmall')
    }
  }

  for (const e of entities.view(['mario', 'hits', 'prevHits'])) {
    const hits = e.hits;
    const prevHits = e.prevHits;
    if (hits && prevHits) {
      const hit = hits.find(h => h.normal.y > 0);

      if (hit && !prevHits.find(p => p.e === hit.e)) {
        if (hit.normal.y > 0) {
          audio.sounds.play('bump');
        }
      }
    }
  }
}