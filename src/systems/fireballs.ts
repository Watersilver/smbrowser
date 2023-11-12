import { getSmb1Audio } from "../audio";
import display from "../display";
import { Vec2d, aabb } from "../engine";
import entities from "../entities";
import newFireball from "../entityFactories/newFireball";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

// Preload views
entities.view(['mario']);
entities.view(['fireball']);

const rect = {pos: new Vec2d(0, 0), size: new Vec2d(8, 8)};

const audio = getSmb1Audio();

const collider = new Collidable();
const collidee = new Collidable();

export default function fireballs(dt: number) {
  for (const e of entities.view(['mario'])) {
    if (e.mario?.shot) {
      const direction = e.mario.skidding ? -e.mario.facing : e.mario.facing;
      let x = e.position.x;
      let y = e.position.y;
      if (e.smb1MarioAnimations) {
        x = e.smb1MarioAnimations.container.position.x;
        y = e.smb1MarioAnimations.container.position.y;
      }
      const sv = direction * (150 + Math.abs(e.dynamic?.velocity.x ?? 0) * (e.mario.skidding ? 0 : 1));
      const f = newFireball(x + direction * 2, y, e, sv);
      collider.set(f, dt);
      collider.dr.x += direction * 6;
      const bb = collider.computeBoundingBox();
      for (const u of worldGrid.statics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        if (f === u.userData) continue;
        collidee.set(u.userData);

        const [hit, col] = aabb.dynamicRectVsRect(collider, collidee);
        if (hit && col.normal.x !== 0) {
          if (f.dynamic) f.dynamic.velocity.x = 0;
          break;
        }
      }
      for (const u of worldGrid.kinematics.findNear(bb.l, bb.t, bb.w, bb.h)) {
        if (f === u.userData) continue;
        collidee.set(u.userData, dt);

        const [hit, col] = aabb.dynamicRectVsDynamicRect(collider, collidee);
        if (hit && col.normal.x !== 0) {
          if (f.dynamic) f.dynamic.velocity.x = 0;
          break;
        }
      }
      f.position.x += direction * 6;
      if (f.smb1ObjectsAnimations) {
        f.smb1ObjectsAnimations.container.scale.x = direction;
      }
    }
  }

  for (const e of entities.view(['fireball'])) {
    if (!e.fireball) continue;

    if (e.dynamic) {
      const grounded = e.touchingDown?.length && e.dynamic.velocity.y >= 0;
      if (grounded) {
        e.dynamic.velocity.y = -170;
      }
    }

    rect.pos = e.position;
    if (!display.overlapsRectBroad(rect)) {
      entities.remove(e);
    }

    const hitSomething =
      !e.dynamic?.velocity.x
      || Math.sign(e.dynamic.velocity.x) !== Math.sign(e.fireball.startVelocity)
      || Math.abs(e.dynamic.velocity.x) < Math.abs(e.fireball.startVelocity) * 0.1;
    if (hitSomething) {
      delete e.fireball;
      delete e.dynamic;
      e.fireballHit = true;
      if (e.smb1ObjectsAnimations) {
        e.smb1ObjectsAnimations.setFrame(0);
        e.smb1ObjectsAnimations.loopsPerSecond = 5;
        e.smb1ObjectsAnimations.setAnimation('firework');
        if (!e.fireballHitEnemy) audio.sounds.play('bump');
      }
    }
  }
}