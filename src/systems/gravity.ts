import entities from "../entities";

export default function gravity(magnitude: number, dt: number) {
  for (const e of entities.view(['dynamic'])) {
    const d = e.dynamic;
    if (d) {
      d.acceleration.y += magnitude;
    }
  }
}