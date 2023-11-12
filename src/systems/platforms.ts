import display from "../display";
import { Vec2d } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";

// Preload views
entities.view(['platform']);
entities.view(['platformConnection', 'platformConnectionIsConnected']);

const routeSpeed = 75;

const maxDescendSpeed = 100;

const maxFallSpeed = 200;

const maxConnectedSpeed = 100;

const connectedAccel = 25;

const platformRect = new Collidable();

export default function platforms(dt: number) {
  for (const e of entities.view(['platform'])) {
    const p = e.platform;

    if (!p) continue;

    const o = p.oscillate;

    if (o) {
      o.t += dt;
      while (o.t > Math.PI * 2 / o.freq) o.t -= Math.PI * 2 / o.freq;

      const amplitude = new Vec2d(o.from.x, o.from.y).sub(o.to).length() * 0.5;

      const displacement = Math.cos(o.freq * o.t + o.phase) * amplitude;

      const targetPos = o.middle.add(o.from.sub(o.middle).unit().mul(displacement));

      const type = e.kinematic ? e.kinematic : e.dynamic;

      if (type) {
        const dx = targetPos.x - e.position.x;
        const dy = targetPos.y - e.position.y;
        type.velocity.x = dx / dt;
        type.velocity.y = dy / dt;
      }
    } else if (p.moveTo) {
      if (e.touchingUp?.find(m => m.mario)) {
        delete e.touchingUp;
        if (e.kinematic) {
          const v = p.moveTo.location.sub(e.position).unit().mul(routeSpeed);
          e.kinematic.velocity.x = v.x;
          e.kinematic.velocity.y = v.y;
        }
      }

      if (e.kinematic) {
        if (p.moveTo.stop) {
          e.kinematic.velocity.x = 0;
          e.kinematic.velocity.y = 0;
          delete p.moveTo;
        } else {
          if (p.moveTo.location.sub(e.position).length() <= e.kinematic.velocity.mul(dt).length()) {
            const dr = p.moveTo.location.sub(e.position);
            e.kinematic.velocity.x = dr.x / dt;
            e.kinematic.velocity.y = dr.y / dt;
            p.moveTo.stop = true;
          }

          if (p.moveTo.location.sub(e.positionStart).dot(p.moveTo.location.sub(e.position)) < -1) {
            e.position = p.moveTo.location;
            e.kinematic.velocity.x = 0;
            e.kinematic.velocity.y = 0;
            delete p.moveTo;
          };
        }
      }
    } else if (p.crumble) {
      const m = e.touchingUp?.find(m => m.mario);
      if (m) {
        if (e.kinematic) {
          e.kinematic.acceleration.y = m.gravity ?? 0;
          if (e.kinematic.velocity.y > maxDescendSpeed) {
            e.kinematic.acceleration.y = 0;
            e.kinematic.velocity.y = maxDescendSpeed;
          }
        }
      } else {
        if (e.kinematic) {
          e.kinematic.acceleration.y = 0;
          e.kinematic.velocity.y = 0;
        }
      }
    } else if (p.bounded) {
      if (e.kinematic) {
        if (e.kinematic.velocity.y > 0) {
          while (e.position.y > p.bounded.bottom) {
            const h = p.bounded.bottom - p.bounded.top;
            e.position.y -= h;
          }
        } else {
          while (e.position.y < p.bounded.top) {
            const h = p.bounded.bottom - p.bounded.top;
            e.position.y += h;
          }
        }
      }
    } else if (p.fall) {
      if (e.kinematic) {
        e.kinematic.acceleration.y = 200;
        if (e.kinematic.velocity.y > maxFallSpeed) {
          e.kinematic.acceleration.y = 0;
          e.kinematic.velocity.y = maxFallSpeed;
        }

        platformRect.set(e);
        if (!display.overlapsRectBroad(platformRect)) {
          entities.remove(e);
        }
      }
    }
  }
  
  for (const e of entities.view(['platformConnection', 'platformConnectionIsConnected'])) {
    const pc = e.platformConnection;

    if (!pc) continue;

    const k1 = pc.p1.kinematic
    const k2 = pc.p2.kinematic;

    if (!k1 || !k2) continue;

    let onAPlatform = false;
    for (const platform of ['p1', 'p2'] as ('p1' | 'p2')[]) {
      const k = platform === 'p1' ? k1 : k2;
      const kother = platform === 'p1' ? k2 : k1;

      if (pc[platform].touchingUp?.find(m => m.mario)) {
        onAPlatform = true;
        k.acceleration.y = connectedAccel;
        if (k.velocity.y > maxConnectedSpeed) {
          k.acceleration.y = 0;
          k.velocity.y = maxConnectedSpeed;
          kother.velocity.y = -k.velocity.y;
        } else {
          kother.acceleration.y = -k.acceleration.y;
          kother.velocity.y = -k.velocity.y;
        }
      }
    }

    if (!onAPlatform) {
      // decel when not on platform
      if (k1.velocity.y) {
        const v1dir = Math.sign(k1.velocity.y);
        k1.acceleration.y = -connectedAccel * v1dir;
        if (Math.sign(k1.velocity.y + k1.acceleration.y * dt) !== v1dir) {
          k1.acceleration.y = 0;
          k1.velocity.y = 0;
          k2.velocity.y = 0;
          k2.acceleration.y = 0;
        } else {
          k2.acceleration.y = -k1.acceleration.y;
        }
      }
    }
  }
}