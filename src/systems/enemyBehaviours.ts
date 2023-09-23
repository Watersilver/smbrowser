import { Display } from "../display";
import { aabb } from "../engine";
import entities from "../entities";
import newEnemy from "../entityFactories/newEnemy";
import Collidable from "../utils/collidable";
import zones from "../zones";

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