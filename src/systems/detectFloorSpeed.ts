import entities from "../entities";

// Preload views
entities.view(['touchingDown', 'dynamic', 'floorSpeed']);
entities.view(['touchingDown', 'dynamic', 'floorSpeedY']);

export default function detectFloorSpeedY() {
  for (const component of ['floorSpeed', 'floorSpeedY'] as ('floorSpeed' | 'floorSpeedY')[]) {
    for (const e of entities.view(['touchingDown', 'dynamic', component])) {
      const d = e.dynamic;
      const floors = e.touchingDown;
      if (e[component] === undefined) continue;
      if (!d || !floors) {
        e[component] = 0;
        continue;
      }
  
      e[component] = floors.reduce((f, c) => {
        if (Math.abs(f) > Math.abs(c.kinematic?.velocity.x ?? 0)) {
          return c.kinematic?.velocity.x ?? 0;
        } else {
          return f;
        }
      }, Infinity);
  
      if (!Number.isFinite(e[component])) {
        e[component] = 0;
      }
    }
  }
}