import entities from "../entities";

export default function speedLimit() {
  for (const ent of entities.view(['dynamic'])) {
    const d = ent.dynamic;
    if (!d) return;
    const l = d.velocity.length();
    const max = 1000;
    if (l > max) {
      d.velocity = d.velocity.unit().mul(max);
    }
  }
}