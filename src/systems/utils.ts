import display from "../display";
import { Vec2d } from "../engine";
import entities from "../entities";

// Preload views
entities.view(['dynamic']);
entities.view(['kinematic']);
entities.view(['moving']);
entities.view(['angVel']);

type RenderProps =
| 'smb1TilesSprites'
| 'smb1ObjectsSprites'
| 'smb1ObjectsAnimations'
| 'smb1TilesSpritesEditMode'
| 'smb1TilesAnimations'
| 'smb1MarioAnimations'
| 'smb1EnemiesAnimations';

const handledRenderables: Set<string> = new Set();

const systemUtils = {
  speedLimiter(velocity: Vec2d, maxSpeed?: number) {
    const l = velocity.length();
    const max = maxSpeed ?? 1000;
    if (l > max) {
      velocity = velocity.unit().mul(max);
      return velocity;
    }
  },

  addRemoveRenderable(p: RenderProps) {
    if (handledRenderables.has(p)) return;
    handledRenderables.add(p);

    entities.onPropChange(p, (e, a) => {
      if (a?.container.parent) a?.container.removeFromParent();
      const cont = e[p]?.container;
      if (cont) {
        if (a) {
          a.container.position.x = e.position.x;
          a.container.position.y = e.position.y;

          a.container.filters = e.filters ?? null;
        }
        // Don't add statics if out of camera, culling system will do that
        if (!e.static || display.containsBroad(e.position) || e.spring) {
          display.add(cont);
        }
      }
    });
    
    entities.onRemoving([p], e => {
      const cont = e[p]?.container;
      if (cont?.parent) {
        cont.filters = null;
        cont.removeFromParent();
      }
    });

    entities.onPropChange('filters', e => {
      for (const r of handledRenderables) {
        const cont = e[r as RenderProps]?.container;
        if (cont) {
          cont.filters = e.filters ?? null;
        }
      }
    });
  },

  updateRenderable(p: RenderProps, dt: number) {
    for (const e of entities.view(['dynamic', p])) {
      const a = e[p];
      if (!a) continue;
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }

    for (const e of entities.view(['kinematic', p])) {
      const a = e[p];
      if (!a) continue;
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }

    for (const e of entities.view(['moving', p])) {
      const a = e[p];
      if (!a) continue;
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }

    for (const e of entities.view(['angVel'])) {
      if (!e.angVel) continue;
      const a = e[p];
      if (!a) continue;
      a.container.angle += e.angVel * dt;
    }
  }
}

export default systemUtils;