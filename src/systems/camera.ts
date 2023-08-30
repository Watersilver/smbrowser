import { Display } from "../display";
import { aabb } from "../engine";
import entities, { Entity } from "../entities";
import zones from "../zones";

let z: {x: number; y: number; w: number; h: number} | null = null;

export default function camera(display: Display) {

  let mario: Entity | null = null;
  for (const e of entities.view(['mario'])) {
    mario = e;
  }

  if (mario) {
    const cx = mario.position.x, cy = mario.position.y + mario.size.y * 0.5 - 16;

    let preserveCamZone = false;
    for (const zone of zones.preserveCamera) {
      if (aabb.pointVsRect({x: cx, y: cy}, {pos: {x: zone.x, y: zone.y}, size: {x: zone.w, y: zone.h}})) {
        preserveCamZone = true;
      }
    }

    display.moveToScale(3);
    display.moveToCenter(cx, cy);

    if (!preserveCamZone) {
      z = null;
      for (const zone of zones.camera) {
        if (aabb.pointVsRect({x: cx, y: cy}, {pos: {x: zone.x, y: zone.y}, size: {x: zone.w, y: zone.h}})) {
          z = zone;
        }
      }
    }

    if (z) display.moveToClamp(cx, cy, 0.1, z.x, z.y, z.w, z.h);
  }
}