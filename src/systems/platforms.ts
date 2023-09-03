import { Vec2d } from "../engine";
import entities from "../entities";

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

      // for (const ent of entities.view(['kinematic'])) {
      //   const xstart = ent.positionStart.x;
      //   const ystart = ent.positionStart.y;
      //   const x = xstart + xdis;
      //   const y = ystart + ydis;
      //   if (ent.kinematic) {
      //     const dx = x - ent.position.x;
      //     const dy = y - ent.position.y;
      //     ent.kinematic.velocity.x = dx / dt;
      //     ent.kinematic.velocity.y = dy / dt;
      //   }
      // }
    }
  }
}