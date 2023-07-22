import entities from "../entities";

entities.onAdding([], e => {
  e.positionPrev.x = e.position.x;
  e.positionPrev.y = e.position.y;
});

export default function storePrevPos() {
  for (const ent of entities.view(['dynamic', 'kinematic'])) {
    ent.positionPrev.x = ent.position.x;
    ent.positionPrev.y = ent.position.y;
  }
}