import entities from "../entities";

export default function velocity(dt: number) {
  for (const e of entities.view(['dynamic'])) {
    const d = e.dynamic;
    if (d) {
      e.position = e.position.add(d.velocity.mul(dt));
    }
  }

  for (const e of entities.view(['kinematic'])) {
    const k = e.kinematic;
    if (k) {
      e.position = e.position.add(k.velocity.mul(dt));
    }
  }
}