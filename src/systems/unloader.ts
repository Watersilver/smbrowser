import { aabb } from "../engine";
import entities from "../entities";
import { Zone } from "../types";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";
import zones from "../zones";

// Preload views
entities.view(['mario']);

const c1 = new Collidable();
const c2 = new Collidable();
const c3 = new Collidable();

function *unloadables(l: number, t: number, w: number, h: number) {
  yield* worldGrid.dynamics.findNear(l,t,w,h);
  // yield* worldGrid.statics.findNear(l,t,w,h);
  // yield* worldGrid.grid.findNear(l,t,w,h);
  yield* worldGrid.sensors.findNear(l,t,w,h);
  yield* worldGrid.kinematics.findNear(l,t,w,h);
}

export default class Unloader {

  limit = -Infinity;

  private active = true;
  stop() {
    this.active = false;
  }

  unload() {
    if (!this.active) return;
    for (const e of entities.view(['mario'])) {
      c1.set(e);
      c2.set(e, undefined, true);
      for (const uz of zones.unload) {
        if (
          aabb.rectVsRect(c3.setToZone(uz), c2)
          && !aabb.rectVsRect(c3, c1)
          && e.position.x > uz.x + uz.w
        ) {
          this.scanAndDestroy(uz, this.limit);
          this.limit = uz.x;
          if (e.mario) e.mario.respawnPoint = {...e.position};
          const s = new Set(zones.unload);
          s.delete(uz);
          zones.unload.length = 0;
          zones.unload.push(...s);
          break;
        }
      }
    }
  }

  private scanAndDestroy(z: Zone, limit: number) {
    if (!this.active) return;
    const zz = {...z};
    zz.x -= z.w;

    for (const u of unloadables(zz.x, zz.y, zz.w, zz.h)) {
      entities.remove(u.userData);
    }

    if (zz.x > limit) {
      setTimeout(() => this.scanAndDestroy(zz, limit), 100);
    } else {
      console.log('unload done');
    }
  }
}
