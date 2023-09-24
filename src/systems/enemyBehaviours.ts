import { getSmb1Audio } from "../audio";
import { Display } from "../display";
import { Vec2d, aabb } from "../engine";
import entities, { Entity } from "../entities";
import newEnemy from "../entityFactories/newEnemy";
import Collidable from "../utils/collidable";
import zones from "../zones";

const audio = getSmb1Audio();

const c1 = new Collidable();

const piranhaSpeed = 30;
const piranhaIdle = 1;

export default function enemyBehaviours(dt: number, display: Display) {
  const marioInPipe = entities.view(['mario']).some(m => m.mario?.inPipe);

  for (const e of entities.view(['piranhaPlant'])) {
    const p = e.piranhaPlant;
    if (!p) continue;

    if (p.inTime !== undefined) {
      p.inTime -= dt;

      if (p.inTime <= 0) {
        delete p.inTime;
      }
    } else if (
      p.emerging
      && !marioInPipe
    ) {
      p.height += piranhaSpeed * dt;

      if (p.height >= 24) {
        p.height = 24;
        p.outTime = piranhaIdle;
        delete p.emerging;
      }
    } else if (p.outTime !== undefined) {
      p.outTime -= dt;

      if (p.outTime <= 0) {
        delete p.outTime;
      }
    } else if (p.height) {
      p.height -= piranhaSpeed * dt;

      if (p.height <= 0) {
        p.height = 0;
        p.inTime = piranhaIdle;
      }
    } else if (!entities.view(['mario']).find(m => 32 >= Math.abs(m.position.x - e.position.x))) {
      p.emerging = true;
    }

    e.position.y = e.positionStart.y - p.height;
  }

  for (const e of entities.view(['blooper'])) {
    c1.set(e);
    if (!display.overlapsRectBroad(c1)) {
      continue;
    }

    const b = e.blooper;
    if (!b) continue;

    // If underwater, don't move out of zone.
    const u = zones.underwater.find(z => aabb.pointVsRect(e.position, c1.setToZone(z)));

    if (b.moving) {
      const moveComponentSpeed = 55;
      // Move diagonally, always same distance towards direction.
      e.position.x += dt * moveComponentSpeed * (b.moving.direction === 'left' ? -1 : 1);
      e.position.y -= dt * moveComponentSpeed;
      b.moving.progress += dt * 2;

      if (e.smb1EnemiesAnimations) {
        if (b.moving.progress > 0.9) {
          e.smb1EnemiesAnimations.setFrame(1);
        } else {
          e.smb1EnemiesAnimations.setFrame(0);
        }
      }

      if (b.moving.progress > 1) {
        delete b.moving;
        b.forcedSinking = 0.3;
      }
    } else {
      const sinkSpeed = 35;
      e.position.y += dt * sinkSpeed;

      if (e.smb1EnemiesAnimations) {
        e.smb1EnemiesAnimations.setFrame(1);
      }

      if (b.forcedSinking !== undefined) {
        b.forcedSinking -= dt;
        if (b.forcedSinking <= 0) delete b.forcedSinking;
      } else {
        // Sink until we reach about mario level, then move
        const closestMario = entities.view(['mario']).reduce((a, c) => {
          if (!a) return c;
          const aDist = Math.abs(a.position.x - e.position.x);
          const cDist = Math.abs(c.position.x - e.position.x);
          if (cDist < aDist) return c;
          return a;
        });
  
        if (closestMario) {
          const diff = closestMario.position.y - e.position.y;
          if (diff < 18) {
            b.moving = {
              direction: Math.sign(closestMario.position.x - e.position.x) === 1 ? 'right' : 'left',
              progress: 0
            };

            if (e.smb1EnemiesAnimations) {
              e.smb1EnemiesAnimations.setFrame(0);
            }
          } else if (diff < 25) {
            if (e.smb1EnemiesAnimations) {
              e.smb1EnemiesAnimations.setFrame(0);
            }
          }
        }
      }
    }

    // Move back in zone
    if (u) {
      if (e.position.x < u.x + 16) {
        e.position.x = u.x + 16;
      }
      if (e.position.x > u.x + u.w - 16) {
        e.position.x = u.x + u.w - 16;
      }
      if (e.position.y < u.y + 16) {
        e.position.y = u.y + 16;
      }
      if (e.position.y > u.y + u.w - 16) {
        e.position.y = u.y + u.w - 16;
      }
    }
  }

  cheepspawn(dt, display);
  cheepmove(dt, display);

  billspawn(dt, display);
  billshooter(dt, display);
  billmove(dt, display);

  firespawn(dt, display);
  firemove(dt, display);

  jumpcheepspawn(dt, display);
}

let spawnCooldown = 0;
function cheepspawn(dt: number, display: Display) {

  if (entities.view(['cheep']).length > 9) return;

  const spawn = entities.view(['mario']).some(m => zones.cheep.some(z => aabb.pointVsRect(m.position, c1.setToZone(z))));

  spawnCooldown -= dt;

  if (spawnCooldown < 0) {
    spawnCooldown = Math.random();

    if (spawn && Math.random() < 0.3) {
      const {t, h, r} = display.getBoundingBox();
      const e = newEnemy(r + 8, t + 32 + (h - 40 - 32) * Math.random());

      const fast = Math.random() < 0.5;

      if (fast) {
        e.smb1EnemiesAnimations?.setAnimation('redCheep');
      } else {
        e.smb1EnemiesAnimations?.setAnimation('greenCheep');
      }

      e.cheep = {
        speed: fast ? (25 + 10 * Math.random()) : (7 + 10 * Math.random()),
        direction: -1,
        amplitude: Math.random() < 0.5 ? 16 * Math.random() : 0,
        ySpeed: Math.random() * 10,
        y: 0,
        yDir: Math.random() < 0.5 ? 1 : -1
      }
      e.enemy = {
        shell: true,
        star: true,
        fireball: true,
        stomp: false,
      }
      e.sensor = true;
      e.moving = true;
      e.underwater = true;
    }
  }
}

function cheepmove(dt: number, display: Display) {
  for (const e of entities.view(['cheep'])) {
    const c = e.cheep;
    if (!c) continue;

    e.position.x += c.direction * c.speed * dt;
    c.y += c.ySpeed * c.yDir * dt;
    if (Math.abs(c.y) >= c.amplitude) {
      c.y = Math.sign(c.y) * c.amplitude;
      c.yDir = c.yDir < 0 ? 1 : -1;
    }
    e.position.y = e.positionStart.y + c.y;

    const {l, r} = display.getBoundingBox();
    if (e.position.x < l - 16) entities.remove(e);
    if (e.position.x > r + 16) entities.remove(e);
  }
}

function newBill(x: number, y: number, e?: Entity) {
  const bill = newEnemy(x, y, 'bulletbill');

  bill.enemy = {
    star: true,
    stomp: true,
    shell: true,
    fireball: false
  };
  const closest = entities.view(['mario']).reduce<Entity | undefined>((a, c) => {
    if (!a) return c;
    if (Math.abs(c.position.x - bill.position.x) < Math.abs(c.position.x - bill.position.x)) return c;
    return a;
  }, undefined);
  bill.bill = {
    speed: 111,
    direction: !closest ? 1 : (closest.position.x - bill.position.x) < 0 ? -1 : 1,
    parent: e
  };
  bill.sensor = true;
  bill.moving = true;
  if (bill.smb1EnemiesAnimations) {
    bill.smb1EnemiesAnimations.container.scale.x = -bill.bill.direction;
  }

  return bill;
}

entities.onAdding(['bill'], () => {
  audio.sounds.play('fireworks');
});

function billshooter(dt: number, display: Display) {
  for (const e of entities.view(['billShooter'])) {
    const b = e.billShooter;
    if (
      !b
      || !display.containsBroad(e.position)
      || !entities.view(['mario']).filter(
        m => Math.abs(m.position.x - e.position.x) > 20
      ).some(
        m =>
        // Mario lowest point is below my highest
        m.position.y + m.size.y * 0.5 > e.position.y - e.size.y * 0.5
        // Mario highest point is above my lowest
        && m.position.y - m.size.y * 0.5 < e.position.y + e.size.y * 0.5
      )
    ) continue;

    if (b.cooldownCounter === undefined) b.cooldownCounter = Math.random() * 2 + 1.5;

    b.cooldownCounter -= dt;

    if (b.cooldownCounter <= 0) {
      delete b.cooldownCounter;
      const bill = newBill(e.position.x, e.position.y, e);
      if (bill.smb1EnemiesAnimations) {
        bill.smb1EnemiesAnimations.container.zIndex = -1;
      }
    }
  }
}

function billmove(dt: number, display: Display) {
  for (const e of entities.view(['bill'])) {
    const b = e.bill;
    if (!b) continue;

    e.position.x += b.direction * b.speed * dt;

    const {l, r} = display.getBoundingBox();
    if (e.position.x < l - 16) entities.remove(e);
    if (e.position.x > r + 16) entities.remove(e);

    if (b.parent && Math.abs(b.parent.position.x - e.position.x) > 16) {
      if (e.smb1EnemiesAnimations) {
        e.smb1EnemiesAnimations.container.zIndex = 1;
      }
    }
  }
}

let billSpawnCooldown = 0;
function billspawn(dt: number, display: Display) {

  if (entities.view(['billSwarm']).length) return;

  const spawn = entities.view(['mario']).some(
    // Don't spawn without reason to avoid making creation sound
    m =>
    !m.mario?.dead
    && (!m.dynamic?.velocity || m.dynamic.velocity.x > -80)
    && display.containsBroad(m.position)
    && zones.bill.some(z => aabb.pointVsRect(m.position, c1.setToZone(z)))
  );

  billSpawnCooldown -= dt;

  if (billSpawnCooldown < 0) {
    billSpawnCooldown = Math.random();

    if (spawn && Math.random() < 0.7) {
      const {t, h, r} = display.getBoundingBox();
      const e = newBill(r + 8, t + 32 + (h - 40 - 32) * Math.random());
      e.billSwarm = true;
    }
  }
}

entities.onAdding(['fire'], () => {
  audio.sounds.play('bowserfire');
});

function newFire(x: number, y: number) {
  const e = newEnemy(x, y, 'bowserfire');
  e.size.y = 2;

  e.enemy = {
    star: false,
    stomp: false,
    shell: false,
    fireball: false
  };
  const closest = entities.view(['mario']).reduce<Entity | undefined>((a, c) => {
    if (!a) return c;
    if (Math.abs(c.position.x - e.position.x) < Math.abs(c.position.x - e.position.x)) return c;
    return a;
  }, undefined);
  e.fire = {
    direction: !closest ? 1 : (closest.position.x - e.position.x) < 0 ? -1 : 1,
  };
  e.sensor = true;
  e.moving = true;
  if (e.smb1EnemiesAnimations) {
    e.smb1EnemiesAnimations.container.scale.x = -e.fire.direction;
    e.smb1EnemiesAnimations.loopsPerSecond *= 2;
  }

  return e;
}

let fireSpawnCooldown = 0;
function firespawn(dt: number, display: Display) {

  if (entities.view(['fire']).length) return;

  const spawn = entities.view(['mario']).some(
    // Don't spawn without reason to avoid making creation sound
    m =>
    !m.mario?.dead
    && (!m.dynamic?.velocity || m.dynamic.velocity.x > -80)
    && display.containsBroad(m.position)
    && zones.fire.some(z => aabb.pointVsRect(m.position, c1.setToZone(z)))
  );

  fireSpawnCooldown -= dt;

  if (fireSpawnCooldown < 0) {
    fireSpawnCooldown = 1;

    if (spawn) {
      const {t, h, r} = display.getBoundingBox();
      const top = 48;
      newFire(r + 8, t + top + (h - 72 - top) * Math.random());
    }
  }
}

function firemove(dt: number, display: Display) {
  for (const e of entities.view(['fire'])) {
    const f = e.fire;
    if (!f) continue;

    e.position.x += f.direction * 80 * dt;

    if (f.targetY !== undefined) {
      const s = Math.sign(f.targetY - e.position.y);
      e.position.y += s * dt * 22;
      const safter = Math.sign(f.targetY - e.position.y);

      if (s !== safter) {
        e.position.y = f.targetY;
        delete f.targetY;
      }
    }

    const {l, r} = display.getBoundingBox();
    if (e.position.x < l - 16) entities.remove(e);
    if (e.position.x > r + 16) entities.remove(e);
  }
}

let jumpCheepCooldown = 0;
function jumpcheepspawn(dt: number, display: Display) {

  for (const e of entities.view(['jumpcheep'])) {
    c1.set(e);
    if (!e.deleteOutOfCam && display.overlapsRectBroad(c1)) {
      e.deleteOutOfCam = true;
    }
  }

  if (entities.view(['jumpcheep']).length > 2) return;

  const spawn = entities.view(['mario']).some(
    m => zones.jumpCheep.some(z => aabb.pointVsRect(m.position, c1.setToZone(z)))
  );

  jumpCheepCooldown -= dt;

  if (jumpCheepCooldown < 0) {
    jumpCheepCooldown = Math.random() * 0.2;

    if (spawn && Math.random() < 0.5) {
      const {t, h, l, w} = display.getBoundingBox();
      const e = newEnemy(l + Math.random() * w * 0.75, t + h + 8, 'redCheep');
      if (e.smb1EnemiesAnimations) {
        e.smb1EnemiesAnimations.container.scale.x = -1;
      }
      e.enemy = {
        shell: true,
        fireball: true,
        star: true,
        stomp: true
      };
      e.gravity = 400;
      e.jumpcheep = true;
      e.goThrougWalls = true;
      e.dynamic = {
        velocity: new Vec2d(30 + Math.random() * 122, -Math.sqrt(2 * e.gravity * (h - 8))),
        acceleration: new Vec2d(0, 0)
      };
    }
  }
}