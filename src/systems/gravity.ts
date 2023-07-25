import entities from "../entities";

export default function gravity() {
  for (const e of entities.view(['dynamic', 'gravity'])) {
    const d = e.dynamic;
    const g = e.gravity;
    if (d && g) {
      d.acceleration.y += g;
    }
  }
}