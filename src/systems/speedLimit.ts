import entities from "../entities";
import systemUtils from "./utils";

export default function speedLimit() {
  for (const ent of entities.view(['dynamic'])) {
    const d = ent.dynamic;
    if (!d) continue;
    const v = systemUtils.speedLimiter(d.velocity, ent.maxSpeed);
    if (v) {
      d.velocity.set(v);
    }
  }
}