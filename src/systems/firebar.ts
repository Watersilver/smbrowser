import { Vec2d } from "../engine";
import entities from "../entities";

// Preload views
entities.view(['firebarFireball']);
entities.view(['firebar']);

export default function firebar(dt: number) {
  for (const e of entities.view(['firebarFireball'])) {
    if (!e.firebarFireball?.parent.firebar) continue;

    e.position.x = e.firebarFireball.parent.position.x;
    e.position.y = e.firebarFireball.parent.position.y;

    const displacement = new Vec2d(e.firebarFireball.length, e.firebarFireball.parent.firebar.angle).toCartesian();
    e.position.x += displacement.x;
    e.position.y += displacement.y;
  }

  for (const e of entities.view(['firebar'])) {
    if (!e.firebar) continue;

    e.firebar.angle += dt * e.firebar.angvel;
    while (e.firebar.angle > Math.PI * 2) e.firebar.angle -= Math.PI * 2;
    while (e.firebar.angle < 0) e.firebar.angle += Math.PI * 2;
  }
}