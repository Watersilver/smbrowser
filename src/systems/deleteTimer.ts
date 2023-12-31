import entities from "../entities";

// Preload views
entities.view(['deleteTimer']);

export default function deleteTimer(dt: number) {
  for (const e of entities.view(['deleteTimer'])) {
    if (e.deleteTimer === undefined) continue;

    e.deleteTimer -= dt;

    if (e.deleteTimer <= 0) {
      entities.remove(e);
    }
  }
}