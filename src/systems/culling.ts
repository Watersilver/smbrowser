import { Display } from "../display";
import { Entity } from "../entities";
import worldGrid from "../world-grid";

export default class Culling {
  private current: Set<Entity> = new Set();
  private prev: Set<Entity> = new Set();

  // cullAll() {
  //   for (const e of entities.view(['static'])) {
  //     const s = e.smb1TilesSprites || e.smb1TilesAnimations;
  //     if (!s) continue;
  //     s.container.removeFromParent();
  //   }
  // }

  update(display: Display) {
    const {l,t,w,h} = display.getBoundingBox();

    this.current = new Set();

    // Parallax move entities that are within bounds
    for (const u of worldGrid.statics.findNear(l,t,w,h)) {
      const e = u.userData;
      const s = e.smb1TilesSprites || e.smb1TilesAnimations;
      if (!s) continue;

      this.current.add(e);

      if (!this.prev.has(e)) {
        display.add(s.container);
      } else {
        this.prev.delete(e);
      }
    }

    for (const e of this.prev) {
      const s = e.smb1TilesSprites || e.smb1TilesAnimations;
      if (!s) continue;
      s.container.removeFromParent();
    }

    this.prev = this.current;
  }
}
