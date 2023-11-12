import { Display } from "../display";
import entities, { Entity } from "../entities";
import worldGrid from "../world-grid";

// Preload views
entities.view(['distanceModifiers']);

export default class Parallax {
  private prev: Set<Entity> = new Set();
  private enabled = true;

  /** passing boolean forces enable disable, otherwise just switches between them */
  toggle(enabled?: boolean) {
    if (enabled === undefined) this.enabled = !this.enabled;
    else this.enabled = enabled;

    if (!this.enabled) {
      for (const e of entities.view(['distanceModifiers'])) {
        const s = e.smb1TilesSprites;
        if (!s) continue;
        s.container.position.x = e.position.x;
        s.container.position.y = e.position.y;
      }
    }
  }

  update(display: Display) {
    if (!this.enabled) return;

    const cx = display.getCenterX();
    const cy = display.getCenterY();
    const {l,t,w,h} = display.getBoundingBox();

    // Entities that got moved before but not now should return to original place
    for (const e of this.prev) {
      const s = e.smb1TilesSprites;
      if (!s) continue;
      s.container.position.x = e.position.x;
      s.container.position.y = e.position.y;
    }

    this.prev.clear();

    // Parallax move entities that are within bounds
    for (const u of worldGrid.grid.findNear(l-w*0.5,t,w*2,h)) {
      const e = u.userData;
      const s = e.smb1TilesSprites;
      const d = e.distanceModifiers;
      if (!s || !d) continue;
      this.prev.add(e);

      const diffx = cx - e.position.x;
      const diffy = cy - e.position.y;
      s.container.position.x = e.position.x + diffx * d.x;
      s.container.position.y = e.position.y + diffy * d.y;
    }
  }
}
