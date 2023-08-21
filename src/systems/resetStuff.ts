import entities from "../entities";

export default function resetStuff() {
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

  for (const ent of entities.view(['dynamic'])) {
    if (ent.dynamic) {
      ent.dynamic.acceleration.x = 0;
      ent.dynamic.acceleration.y = 0;
    }
  }

  for (const ent of entities.view(['mario'])) {
    if (ent.mario) {
      ent.mario.changedSize = false;
      ent.mario.gainedPow = false;
      ent.mario.shot = false;
      ent.mario.gainedOneUp = false;
    }
  }

  for (const ent of entities.view(['kinematic'])) {
    if (ent.kinematic) {
      ent.kinematic.acceleration.x = 0;
      ent.kinematic.acceleration.y = 0;
    }
  }
}