import { Graphics } from "pixi.js";
import entities from "../entities";

const piranhaSpeed = 30;
const piranhaIdle = 1;

export default function enemyBehaviours(dt: number) {
  const marioInPipe = entities.view(['mario']).some(m => m.mario?.inPipe);

  for (const e of entities.view(['piranhaPlant'])) {
    const p = e.piranhaPlant;
    if (!p) continue;

    if (p.inTime !== undefined) {
      p.inTime -= dt;

      if (p.inTime <= 0) {
        delete p.inTime;
      }
    } else if (
      p.emerging
      && !marioInPipe
    ) {
      p.height += piranhaSpeed * dt;

      if (p.height >= 24) {
        p.height = 24;
        p.outTime = piranhaIdle;
        delete p.emerging;
      }
    } else if (p.outTime !== undefined) {
      p.outTime -= dt;

      if (p.outTime <= 0) {
        delete p.outTime;
      }
    } else if (p.height) {
      p.height -= piranhaSpeed * dt;

      if (p.height <= 0) {
        p.height = 0;
        p.inTime = piranhaIdle;
      }
    } else if (!entities.view(['mario']).find(m => 32 >= Math.abs(m.position.x - e.position.x))) {
      p.emerging = true;
    }

    e.position.y = e.positionStart.y - p.height;
  }
}