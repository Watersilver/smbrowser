import { aabb } from "../engine";
import entities from "../entities";
import newClutter from "../entityFactories/newClutter";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

// Preload views
entities.view(['mario']);
entities.view(['vine', 'moving']);

const collider = new Collidable();
const collidee = new Collidable();

export default function vines(dt: number) {
  // Grow
  for (const e of entities.view(['vine', 'moving'])) {
    if (!e.vine) continue;

    // compute new size and position
    e.size.y += (e.vine.targetHeight - e.size.y) * dt * 0.3 * 5;
    if (e.vine.targetHeight - e.size.y < 0.1) e.size.y = e.vine.targetHeight;
    const bottom = e.vine.root.smb1TilesSprites?.container.position.y ?? e.vine.root.position.y;
    e.position.y = bottom - e.size.y * 0.5;

    // Create new parts
    while (Math.ceil((e.size.y) / 16) > e.vine.parts.length) {
      const v = newClutter(0, 0, {type: 'object', frame: e.vine.parts.length ? 'vine' : 'vinetop'});
      if (v.smb1ObjectsSprites?.container) {
        const cont = v.smb1ObjectsSprites.container;
        cont.zIndex = -2;
        cont.visible = false;
        cont.position.x = e.vine.root.position.x;
        setTimeout(() => cont.visible = true);
      }
      e.vine.parts.push(v);
    }

    // Move parts
    const top = bottom - e.size.y;
    for (let i = 0; i < e.vine.parts.length; i++) {
      const part = e.vine.parts[i];
      if (part?.smb1ObjectsSprites) {
        part.smb1ObjectsSprites.container.position.y = top + i * 16;
      }
    }

    // Become static if done growing
    if (e.size.y === e.vine.targetHeight) {
      delete e.moving;
    }
  }

  // Grab
  for (const e of entities.view(['mario'])) {
    if (!e.mario) continue;
    delete e.mario.climbing;

    if (e.mario.climbingCooldown) {
      e.mario.climbingCooldown -= dt;
      if (e.mario.climbingCooldown <= 0) {
        delete e.mario.climbingCooldown;
      }
      continue;
    }

    collider.set(e, dt);
    const bb = collider.computeBoundingBox();
    for (const u of worldGrid.sensors.findNear(bb.l, bb.t, bb.w, bb.h)) {
      const uu = u.userData;
      if (uu.vine) {
        collidee.set(uu);

        if (aabb.rectVsRect(collider, collidee)) {
          e.mario.ducking = false;
          e.mario.jumping = true;
          e.mario.climbing = uu;
          e.mario.facing = e.position.x - uu.position.x < 0 ? 1 : -1;
          if (e.dynamic) {
            e.dynamic.velocity.x = 0;
            e.dynamic.velocity.y = 0;
            e.dynamic.acceleration.x = 0;
            e.dynamic.acceleration.y = 0;
          }
          break;
        }
      }
    }
  }
}
