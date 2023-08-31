import display from "../display";
import { Vec2d } from "../engine";
import entities from "../entities";

type RenderProps =
| 'smb1TilesSprites'
| 'smb1ObjectsSprites'
| 'smb1ObjectsAnimations'
| 'smb1TilesSpritesEditMode'
| 'smb1TilesAnimations'
| 'smb1MarioAnimations';

const handledRenderables: Set<string> = new Set();

const systemUtils = {
  speedLimiter(velocity: Vec2d) {
    const l = velocity.length();
    const max = 1000;
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
        display.add(cont);
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

  updateRenderable(p: RenderProps) {
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
  }
}

export default systemUtils;