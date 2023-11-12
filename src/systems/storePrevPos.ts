import entities from "../entities";

// Preload views
entities.view(['moving']);
entities.view(['dynamic']);
entities.view(['kinematic']);

entities.onAdding([], e => {
  e.positionPrev.x = e.position.x;
  e.positionPrev.y = e.position.y;
  e.positionStart.x = e.position.x;
  e.positionStart.y = e.position.y;
});

export default function storePrevPos() {
  for (const ent of entities.view(['moving'])) {
    ent.positionPrev.x = ent.position.x;
    ent.positionPrev.y = ent.position.y;
  }
  for (const ent of entities.view(['dynamic'])) {
    ent.positionPrev.x = ent.position.x;
    ent.positionPrev.y = ent.position.y;
  }
  for (const ent of entities.view(['kinematic'])) {
    ent.positionPrev.x = ent.position.x;
    ent.positionPrev.y = ent.position.y;
  }
}