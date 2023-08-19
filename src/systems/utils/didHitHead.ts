import { Entity } from "../../entities";

export default function didHitHead(e: Entity) {
  const hits = e.hits;
  const prevHits = e.prevHits;
  if (hits && prevHits) {
    const hit = hits.find(h => h.normal.y > 0);

    if (hit && !prevHits.find(p => p.e === hit.e)) {
      if (hit.normal.y > 0) {
        return true;
      }
    }
  }
  return false;
}