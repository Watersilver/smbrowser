import entities from "../entities";

// Preload views
entities.view(['hits', 'prevHits']);
entities.view(['hits']);

export default function storePrevHits() {
  for (const e of entities.view(['hits', 'prevHits'])) {
    const p = e.prevHits;
    const h = e.hits;
    if (p && h) {
      p.length = 0;
      h.forEach(hit => p.push(hit));
    }
  }

  for (const ent of entities.view(['hits'])) {
    if (ent.hits) ent.hits.length = 0;
  }
}