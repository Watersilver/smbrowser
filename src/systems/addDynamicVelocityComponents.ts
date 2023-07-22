import entities from "../entities";

export default function addDynamicVelocityComponents() {
  for (const ent of entities.view(['dynamic', 'dynamicVelocityComponents'])) {
    const d = ent.dynamic;
    const dvc = ent.dynamicVelocityComponents;
    if (d && dvc) {
      for (const comp of Object.values(dvc)) {
        d.velocity.x += comp.x;
        d.velocity.y += comp.y;
      }
    }
  }
}