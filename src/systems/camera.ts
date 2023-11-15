import { Display } from "../display";
import { aabb } from "../engine";
import entities, { Entity } from "../entities";
import { Zone } from "../types";
import Collidable from "../utils/collidable";
import zones from "../zones";

// Preload views
entities.view(['followCam']);

let z: {x: number; y: number; w: number; h: number} | null = null;

const c1 = new Collidable();
const camZones: Zone[] = [];

export default function camera(display: Display) {
  camZones.length = 0;

  let following: Entity | null = null;
  for (const e of entities.view(['followCam'])) {
    following = e;
  }

  if (following) {
    const cx = following.position.x, cy = following.position.y + following.size.y * 0.5 - 16;

    let preserveCamZone = false;
    for (const zone of zones.preserveCamera) {
      if (aabb.pointVsRect(following.position, c1.setToZone(zone))) {
        preserveCamZone = true;
        break;
      }
    }

    display.moveToScale(3);
    display.moveToCenter(cx, cy);

    if (!preserveCamZone) {
      z = null;
      for (const zone of zones.camera) {
        if (aabb.pointVsRect(following.position, c1.setToZone(zone))) {
          z = zone;
          // if (!z) z = zone;
          // else if (z.w * z.h > zone.w * zone.h) z = zone;
        }
      }
    }

    if (z) display.moveToClamp(cx, cy, 0.1, z.x, z.y, z.w, z.h);
  }

  let forcing: Entity | null = null;
  for (const e of entities.view(['forceCam'])) {
    forcing = e;
  }

  if (forcing) {
    const cx = forcing.position.x, cy = forcing.position.y + forcing.size.y * 0.5 - 16;
    display.setScale(3);
    display.setCenter(cx, cy);
  }
}