import { getSmb1Audio } from "../audio";
import { Display } from "../display";
import { Vec2d, aabb } from "../engine";
import entities, { Entity } from "../entities";
import newBowserfire from "../entityFactories/newBowserfire";
import newEnemy from "../entityFactories/newEnemy";
import universal from "../universal";
import Collidable from "../utils/collidable";
import zones from "../zones";

// Preload views
entities.view(['mario']);
entities.view(['piranhaPlant']);
entities.view(['blooper']);
entities.view(['cheep']);
entities.view(['billShooter']);
entities.view(['bill']);
entities.view(['billSwarm']);
entities.view(['fire']);
entities.view(['jumpcheep']);
entities.view(['lakitu']);
entities.view(['spiny']);
entities.view(['lavabubble']);
entities.view(['lavabubbleinstance']);

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
      if (!marioInPipe) p.inTime -= dt;

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
      delete p.emerging;

      if (p.outTime <= 0 || marioInPipe) {
        delete p.outTime;
      }
    } else if (p.height) {
      p.height -= piranhaSpeed * dt;
      delete p.emerging;

      if (p.height <= 0) {
        p.height = 0;
        p.inTime = piranhaIdle;
      }
    } else if (!entities.view(['mario']).find(m => 32 >= Math.abs(m.position.x - e.position.x))) {
      if (!marioInPipe) p.emerging = true;
      else delete p.emerging;
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

  lakitu(dt, display);

  lavabubbles(dt, display);
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
        // Mario lowest point is below my highest - 32
        m.position.y + m.size.y * 0.5 > e.position.y - e.size.y * 0.5 - 32
        // Mario highest point is above my lowest + 32
        && m.position.y - m.size.y * 0.5 < e.position.y + e.size.y * 0.5 + 32
      )
    ) continue;

    if (b.cooldownCounter === undefined) b.cooldownCounter = Math.random();
    if (b.cooldownCounter === 0) b.cooldownCounter = Math.random() * 2 + 1;

    b.cooldownCounter -= dt;

    if (b.cooldownCounter <= 0) {
      b.cooldownCounter = 0;
      // count 8000
      // Add bill spawns
      if (entities.view(['bill']).length < 2) {
        const bill = newBill(e.position.x, e.position.y, e);
        if (bill.smb1EnemiesAnimations) {
          bill.smb1EnemiesAnimations.container.zIndex = -1;
        }
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
      newBowserfire(r + 8, t + top + 8 + (h - 96 - top) * Math.random());
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

let jumpCheepDelay = 0;
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
    m => !m.mario?.inPipe && zones.jumpCheep.some(z => aabb.pointVsRect(m.position, c1.setToZone(z)))
  );

  if (spawn) {
    jumpCheepDelay -= dt;
  } else {
    jumpCheepDelay += dt;
  }
  if (jumpCheepDelay >= 1) jumpCheepDelay = 1;
  else if (jumpCheepDelay <= 0) jumpCheepDelay = 0;

  if (jumpCheepDelay === 0) {
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
        e.gravity = 200;
        e.jumpcheep = true;
        e.goThrougWalls = true;
        e.dynamic = {
          velocity: new Vec2d(30 + Math.random() * 122, -Math.sqrt(2 * e.gravity * (h - 8))),
          acceleration: new Vec2d(0, 0)
        };
      }
    }
  }
}

function newSpiny(x: number, y: number) {
  const e = newEnemy(x, y, 'spinyEgg');
  e.ostensibleSize = new Vec2d(20, 20);

  e.enemy = {
    star: true,
    stomp: false,
    shell: true,
    fireball: true,
    lookTowards: 'direction'
  };
  e.dynamic = {
    velocity: new Vec2d(universal.enemySpeed * (Math.random() * 2 - 1), -30),
    acceleration: new Vec2d(0, 0)
  };
  e.hits = [];
  e.prevHits = [];
  e.touchingDown = [];
  e.movement = {
    horizontal: -universal.enemySpeed,
    flipEachOther: true,
  };
  e.gravity = universal.enemyGravity * 0.7;
  e.maxSpeed = 300;
  e.deleteOutOfCam = true;
  e.spiny = true;

  return e;
}

let lakituCooldown = 0;
function lakitu(dt: number, display: Display) {
  const inZone = entities.view(['mario']).some(
    m => !m.mario?.dead && zones.lakitu.some(z => aabb.pointVsRect(m.position, c1.setToZone(z)))
  );

  if (entities.view(['lakitu']).length) {

    for (const e of entities.view(['lakitu'])) {
      const lak = e.lakitu;
      if (!lak) continue;

      if (e.smb1EnemiesAnimations) {
        if (lak.spawningSpiny > 0) {
          e.smb1EnemiesAnimations.setFrame(1);
        } else {
          e.smb1EnemiesAnimations.setFrame(0);
        }
      }

      if (lak.move.view) {
        const {l, t, w} = display.getBoundingBox();
        lak.move.view.t += dt * 3;
        if (lak.move.view.state === 'in') {
          let prog = Math.sin(lak.move.view.t);
          if (lak.move.view.t >= Math.PI * 0.5) prog = 1;

          e.position.x = l + lak.move.view.relativeX * w;
          e.position.y = t - 16 + 32 * prog;
          if (prog === 1) {
            delete lak.move.view;
          }
        } else {
          lakituCooldown = 2;
          e.deleteOutOfCam = true;
          let prog = Math.cos(lak.move.view.t);
          if (lak.move.view.t >= Math.PI * 0.5) {
            e.position.y -= dt * 100;
          } else {
            e.position.y = t - 16 + 32 * prog;
          }
        }
      } else {
        // Attack
        if (entities.view(['spiny']).length < 3) {
          if (lak.spinyCooldown < 0) {
            lak.spinyCooldown = Math.random() * 1.5 + 1.5;
          }

          lak.spinyCooldown -= dt;

          if (lak.spinyCooldown < 0) {
            lak.spawningSpiny = 0.3;
          }

          const prevSpawn = lak.spawningSpiny;
          lak.spawningSpiny -= dt;
          if (lak.spawningSpiny < 0) {
            lak.spawningSpiny = -1;
            if (prevSpawn >= 0) {
              newSpiny(e.position.x, e.position.y - 8);
            }
          }
        }

        // movement
        const closest = entities.view(['mario']).filter(m => !m.mario?.dead).reduce<Entity | undefined>((a, c) => {
          if (!a) return c;
          if (a.position.distance(e.position) > c.position.distance(e.position)) return c;
          return a;
        }, undefined);
        const maxDist = 6 * 16;
        if (!closest) {
          delete lak.move.circle;
        } else if (closest.dynamic && Math.abs(closest.dynamic.velocity.x) > 50) {
          // run
          delete lak.move.circle;
          const direction = Math.sign(closest.dynamic.velocity.x);
          const distancePrev = Math.abs(closest.position.x - e.position.x);
          lak.vel = direction * (Math.abs(closest.dynamic.velocity.x) + 70);
          e.position.x += lak.vel * dt;
          const diff = closest.position.x - e.position.x;
          const distance = Math.abs(diff);
          if (distance > maxDist && Math.sign(diff) === -direction) {
            if (distancePrev > maxDist) {
              e.position.x -= lak.vel * dt;
              lak.vel = 0;
            } else {
              lak.vel = direction * (Math.abs(closest.dynamic.velocity.x));
              e.position.x = closest.position.x + direction * maxDist;
            }
          }

          if (e.smb1EnemiesAnimations) {
            if (direction === 1) {
              e.smb1EnemiesAnimations.container.scale.x = 1;
            } else {
              e.smb1EnemiesAnimations.container.scale.x = -1;
            }
          }
        } else {
          // circle player
          if (!lak.move.circle) lak.move.circle = {
            direction: Math.sign(lak.vel) === 1 ? 1 : -1
          }

          if (Math.abs(lak.vel) > 50) {
            lak.vel -= lak.vel * 1.5 * dt;
            if (Math.abs(lak.vel) < 50) lak.vel = 50 * lak.move.circle.direction;
          } else {
            lak.vel = 50 * lak.move.circle.direction;
            const distance = Math.abs(closest.position.x - e.position.x);
            if (distance > maxDist) {
              lak.move.circle.direction = closest.position.x - e.position.x > 0 ? 1 : -1;
            }
          }
          e.position.x += lak.vel * dt;

          if (e.smb1EnemiesAnimations) {
            if (lak.move.circle.direction === 1) {
              e.smb1EnemiesAnimations.container.scale.x = 1;
            } else {
              e.smb1EnemiesAnimations.container.scale.x = -1;
            }
          }
        }
      }
    }

    // Check if lakitu should leave
    if (!inZone) {
      const {l, w} = display.getBoundingBox();
      entities.view(['lakitu']).forEach(e => {
        if (e.lakitu && !e.lakitu.move.view) {
          e.lakitu.move.view = {
            relativeX: (e.position.x - l) / w,
            t: 0,
            state: 'out'
          }
        }
      });
    }
    return;
  }

  const inZonePrev = entities.view(['mario']).some(
    m => !m.mario?.dead && zones.lakitu.some(z => aabb.pointVsRect(m.positionPrev, c1.setToZone(z)))
  );

  // Spawn when mario is in lakitu area
  if (inZone) {
    // Have a starting cooldown when first entering area
    if (!inZonePrev || lakituCooldown === 0) {
      lakituCooldown = 2;
    }

    lakituCooldown -= dt;

    if (lakituCooldown <= 0) {
      // 7 secs if lakitu dies till next respawns in same area
      lakituCooldown = 7;

      const {t, l, w} = display.getBoundingBox();
      const e = newEnemy(l + 16 + Math.random() * (w - 32), t - 16, 'lakitu');
      e.size.y = 10;
      e.ostensibleSize = new Vec2d(16, 24);
      e.enemy = {
        shell: true,
        fireball: true,
        star: true,
        stomp: true
      };
      e.lakitu = {
        spinyCooldown: -1,
        spawningSpiny: -1,
        vel: 0,
        move: {
          view: {
            state: 'in',
            t: 0,
            relativeX: (e.position.x - l) / w
          }
        }
      };
      e.sensor = true;
      e.moving = true;
      if (e.smb1EnemiesAnimations) {
        e.smb1EnemiesAnimations.loopsPerSecond = 0;
      }
    }
  }
}

function lavabubbles(dt: number, display: Display) {
  for (const e of entities.view(['lavabubble'])) {
    if (!e.lavabubble) continue;

    const {l, w} = display.getBoundingBox();

    if (e.position.x > l && e.position.x < l + w) {
      e.lavabubble.t += dt;
      if (e.lavabubble.t > e.lavabubble.maxT) {
        e.lavabubble.t -= e.lavabubble.maxT;
        const enem = newEnemy(e.position.x, e.position.y, 'lavaBubble');
        enem.enemy = {
          shell: true,
          fireball: false,
          stomp: false,
          star: true
        };
        enem.lavabubbleinstance = true;
        enem.gravity = 300;
        enem.dynamic = {
          acceleration: new Vec2d(0, 0),
          velocity: new Vec2d(0, 0)
        };
        enem.goThrougWalls = true;

        // find the maximum height of a projectile:
        // h = v0 ^ 2 * sin(theta) / (2 * g)
        // Theta is 0 because we are throwing vertically (at 90 deg) thus:
        // v0 ^ 2 = 2 * h * g =>
        // v0 = sqrt(2*h*g)
        let h = e.lavabubble.maxHeight;
        // h -= 24;
        if (h < 0) h = 0;
        const vy = Math.sqrt(2 * h * enem.gravity);
        enem.dynamic.acceleration.y = -vy / dt;
      }
    }
  }

  for (const e of entities.view(['lavabubbleinstance'])) {
    if (e.position.y > e.positionPrev.y) {
      if (e.smb1EnemiesAnimations) {
        e.smb1EnemiesAnimations.container.angle = 180;
        e.deleteOutOfCam = true;
      }
    }
  }
}