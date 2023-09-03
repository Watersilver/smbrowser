import { getSmb1Audio } from "../audio";
import display from "../display";
import { Vec2d } from "../engine";
import entities from "../entities";
import newFireball from "../entityFactories/newFireball";

const rect = {pos: new Vec2d(0, 0), size: new Vec2d(8, 8)};

const audio = getSmb1Audio();

export default function fireballs() {
  for (const e of entities.view(['mario'])) {
    if (e.mario?.shot) {
      const direction = e.mario.skidding ? -e.mario.facing : e.mario.facing;
      let x = e.position.x;
      let y = e.position.y;
      if (e.smb1MarioAnimations) {
        x = e.smb1MarioAnimations.container.position.x;
        y = e.smb1MarioAnimations.container.position.y;
      }
      const f = newFireball(x + direction * 3, y, e);
      if (f.smb1ObjectsAnimations) {
        f.smb1ObjectsAnimations.container.scale.x = direction;
      }
      if (f.dynamic) {
        f.dynamic.velocity.x = direction * (150 + Math.abs(e.dynamic?.velocity.x ?? 0) * (e.mario.skidding ? 0 : 1));
      }
    }
  }

  for (const e of entities.view(['fireball'])) {
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

    const hitSomething = !e.dynamic?.velocity.x;
    if (hitSomething) {
      delete e.fireball;
      delete e.dynamic;
      e.fireballHit = true;
      if (e.smb1ObjectsAnimations) {
        e.smb1ObjectsAnimations.setFrame(0);
        e.smb1ObjectsAnimations.loopsPerSecond = 5;
        e.smb1ObjectsAnimations.setAnimation('firework');
        audio.sounds.play('bump');
      }
    }
  }
}