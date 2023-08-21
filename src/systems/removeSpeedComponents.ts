import entities from "../entities";

export default function removeSpeedComponents() {
  for (const e of entities.view(['mario', 'dynamic'])) {
    const d = e.dynamic;
    const mario = e.mario;
    if (!d || !mario) continue;

    if (mario.wind) {
      d.velocity.x -= mario.wind;
      mario.wind = 0;
    }
  }

  for (const e of entities.view(['dynamic', 'floorSpeed'])) {
    const d = e.dynamic;
    if (!d) continue;

    if (e.floorSpeed) {
      d.velocity.x -= e.floorSpeed;
      e.floorSpeed = 0;
    }
  }

  // for (const e of entities.view(['dynamic', 'movement'])) {
  //   const d = e.dynamic;
  //   if (!d) continue;

  //   if (e.movement?.horizontal) {
  //     d.velocity.x -= e.movement.horizontal;
  //   }
  // }
}
