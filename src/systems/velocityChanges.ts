import entities, { Entity } from "../entities";

export default function velocityChanges(dt: number) {
  // Add accel to velocity for dynamics 
  for (const e of entities.view(['dynamic'])) {
    const d = e.dynamic;
    if (d) {
      d.velocity = d.velocity.add(d.acceleration.mul(dt));
    }
  }

  // Stop vertical velocity after smash
  for (const e of entities.view(['smash'])) {
    if (!e.smash) continue;
    const d = e.dynamic;
    if (d) {
      d.velocity.y = Math.max(d.velocity.y, 0);
    }
  }

  // horizontal direction change by hit from below
  for (const e of entities.view(['movement', 'touchingDown'])) {
    const farthestHit = e.touchingDown?.reduce((a: Entity | undefined, c): Entity | undefined => {
      if (c.hitAnim === undefined) return a;
      if (!a) return c;
      if (
        Math.abs(c.position.x - e.position.x)
        >
        Math.abs(a.position.x - e.position.x)
      ) {
        return c;
      }
      return a;
    }, undefined);
    if (farthestHit) {
      if (e.movement?.horizontal) {
        const dir = Math.sign(e.position.x - farthestHit.position.x);
        e.movement.horizontal = Math.abs(e.movement.horizontal) * dir;
        e.movement.horizontalNow = true;
      }
    }
  }

  // Mushroom react to hits from bellow
  for (const e of entities.view(['mushroom', 'touchingDown'])) {
    const bonkedFromBelow = !!e.touchingDown?.find(h => h.bonked);
    if (bonkedFromBelow) {
      if (e.movement) {
        e.movement.bounce = -100;
        e.movement.bounceOnce = true;
        e.movement.bounceNow = true;
      }
    }
  }

  // React to movement changes
  for (const e of entities.view(['dynamic', 'movement'])) {
    const d = e.dynamic;
    const m = e.movement;
    if (d && m) {
      if (m.bounceNow) {
        d.velocity.y = m.bounce ?? d.velocity.y;
        if (m.bounceOnce) {
          m.bounce = undefined;
        }
      }
      if (m.horizontalNow) {
        d.velocity.x = m.horizontal ?? 0;
      }
    }
  }

  // Add accel to velocity for kinematics
  for (const e of entities.view(['kinematic'])) {
    const k = e.kinematic;
    if (k) {
      k.velocity = k.velocity.add(k.acceleration.mul(dt));
    }
  }
}
