import entities from "../entities";

export default function clearHitsAndTouched() {
  for (const ent of entities.view(['hits'])) {
    if (ent.hits) ent.hits.length = 0;
  }

  for (const ent of entities.view(['touchingUp'])) {
    if (ent.touchingUp) ent.touchingUp.length = 0;
  }

  for (const ent of entities.view(['touchingRight'])) {
    if (ent.touchingRight) ent.touchingRight.length = 0;
  }

  for (const ent of entities.view(['touchingDown'])) {
    if (ent.touchingDown) ent.touchingDown.length = 0;
  }

  for (const ent of entities.view(['touchingLeft'])) {
    if (ent.touchingLeft) ent.touchingLeft.length = 0;
  }
}