import { Vec2d } from "../engine";
import entities from "../entities";
import systemUtils from "./utils";

// Preload views
entities.view(['mario', 'dynamic']);
entities.view(['dynamic', 'floorSpeed']);

function addXComponent(velocity: Vec2d, x: number) {
  const hSpeedPrev = velocity.x;
  velocity.x += x;
  const limitedVel = systemUtils.speedLimiter(velocity);
  if (limitedVel) {
    const sign = Math.sign(x);
    const speed = Math.abs(hSpeedPrev - limitedVel.x);
    return sign * speed;
  }
  return x;
}

export default function addSpeedComponents() {
  for (const e of entities.view(['mario', 'dynamic'])) {
    const d = e.dynamic;
    const mario = e.mario;
    if (!d || !mario) continue;

    if (mario.wind) {
      mario.wind = addXComponent(d.velocity, mario.wind);
    }
  }

  // for (const e of entities.view(['touchingDown', 'dynamic', 'floorSpeed'])) {
  //   const d = e.dynamic;
  //   const floors = e.touchingDown;
  //   if (!d || !floors) continue;

  //   const floorSpeed = floors.reduce((f, c) => {
  //     if (Math.abs(f) > Math.abs(c.kinematic?.velocity.x ?? 0)) {
  //       return c.kinematic?.velocity.x ?? 0;
  //     } else {
  //       return f;
  //     }
  //   }, Infinity);

  //   if (floorSpeed && Number.isFinite(floorSpeed)) {
  //     e.floorSpeed = addXComponent(d.velocity, floorSpeed);
  //   }
  // }

  for (const e of entities.view(['dynamic', 'floorSpeed'])) {
    const d = e.dynamic;
    if (!d) continue;

    if (e.floorSpeed) {
      e.floorSpeed = addXComponent(d.velocity, e.floorSpeed);
    }
  }

  // for (const e of entities.view(['dynamic', 'movement'])) {
  //   const d = e.dynamic;
  //   if (!d) continue;
  //   const h = e.movement?.horizontal;
  //   if (!h) continue;

  //   addXComponent(d.velocity, h);
  // }
}
