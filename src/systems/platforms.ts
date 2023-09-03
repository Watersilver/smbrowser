import { Vec2d } from "../engine";
import entities from "../entities";

const routeSpeed = 75;

const maxDescendSpeed = 100;

export default function platforms(dt: number) {
  for (const e of entities.view(['platform'])) {
    const p = e.platform;

    if (!p) continue;

    const o = p.oscillate;

    if (o) {
      o.t += dt;
      while (o.t > Math.PI * 2 / o.freq) o.t -= Math.PI * 2 / o.freq;

      const amplitude = new Vec2d(o.from.x, o.from.y).sub(o.to).length() * 0.5;

      const displacement = Math.cos(o.freq * o.t + o.phase) * amplitude;

      const targetPos = o.middle.add(o.from.sub(o.middle).unit().mul(displacement));

      if (e.kinematic) {
        const dx = targetPos.x - e.position.x;
        const dy = targetPos.y - e.position.y;
        e.kinematic.velocity.x = dx / dt;
        e.kinematic.velocity.y = dy / dt;
      }
    } else if (p.moveTo) {
      if (e.touchingUp?.find(m => m.mario)) {
        delete e.touchingUp;
        if (e.kinematic) {
          const v = p.moveTo.location.sub(e.position).unit().mul(routeSpeed);
          e.kinematic.velocity.x = v.x;
          e.kinematic.velocity.y = v.y;
        }
      }

      if (e.kinematic) {
        if (
          p.moveTo.location.sub(e.position).length() <= e.kinematic.velocity.mul(dt).length() ||
          p.moveTo.location.sub(e.positionStart).dot(p.moveTo.location.sub(e.position)) < -1
        ) {
          e.position = p.moveTo.location;
          e.kinematic.velocity.x = 0;
          e.kinematic.velocity.y = 0;
          delete p.moveTo;
        };
      }
    } else if (p.crumble) {
      const m = e.touchingUp?.find(m => m.mario);
      if (m) {
        if (e.kinematic) {
          e.kinematic.acceleration.y = m.gravity ?? 0;
          if (e.kinematic.velocity.y > maxDescendSpeed) {
            e.kinematic.acceleration.y = 0;
          }
        }
      } else {
        if (e.kinematic) {
          e.kinematic.acceleration.y = 0;
          e.kinematic.velocity.y = 0;
        }
      }
    }
  }
}