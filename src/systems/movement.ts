import entities from "../entities";

export default function movement() {
  for (const e of entities.view(['dynamic', 'movement', 'hits'])) {
    const d = e.dynamic;
    if (!d || !e.movement) continue;
    const h = e.movement.horizontal;

    e.movement.horizontalNow = false;

    if (h) {
      const wallhit = e.hits?.find(hit => Math.sign(hit.normal.x) === -Math.sign(h));
      if (wallhit) {
        e.movement.horizontal = -h;
        e.movement.horizontalNow = true;
      }
    }

    const b = e.movement.bounce;

    e.movement.bounceNow = false;

    if (b) {
      const floorhit = e.hits?.find(hit => hit.normal.y < 0);
      if (floorhit) {
        e.movement.bounceNow = true;
      }
    }
  }
}
