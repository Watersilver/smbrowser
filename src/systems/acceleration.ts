import entities from "../entities";

export default function acceleration(dt: number) {
  for (const e of entities.view(['dynamic'])) {
    const d = e.dynamic;
    if (d) {
      d.velocity = d.velocity.add(d.acceleration.mul(dt));
    }
  }
}
