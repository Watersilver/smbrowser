import { aabb } from "../engine";
import entities from "../entities";
import { Zone } from "../types";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";
import zones from "../zones";

const c1 = new Collidable();
const c2 = new Collidable();
const c3 = new Collidable();

function *unloadables(l: number, t: number, w: number, h: number) {
  yield* worldGrid.dynamics.findNear(l,t,w,h);
  // yield* worldGrid.statics.findNear(l,t,w,h);
  // yield* worldGrid.grid.findNear(l,t,w,h);
  yield* worldGrid.sensors.findNear(l,t,w,h);
  // yield* worldGrid.kinematics.findNear(l,t,w,h);
}

export default class Unloader {
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
          this.scanAndDestroy(uz);
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

  private scanAndDestroy(z: Zone) {
    if (!this.active) return;
    const zz = {...z};
    zz.x -= z.w;
  
    let found = 0;
    for (const u of unloadables(zz.x, zz.y, zz.w, zz.h)) {
      found++;
      entities.remove(u.userData);
    }
  
    if (found) {
      setTimeout(() => this.scanAndDestroy(zz), 100);
    } else {
      console.log('unload done');
    }
  }
}
