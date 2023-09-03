import { getSmb1Audio } from "../audio";
import display from "../display";
import { Vec2d } from "../engine";
import { dynamicRectVsRect } from "../engine/aabb";
import entities, { Entity } from "../entities";
import newBrokenBrick from "../entityFactories/newBrokenBrick";
import newCoinFromBlock from "../entityFactories/newCoinFromBlock";
import newFireFlower from "../entityFactories/newFireFlower";
import newMushroom from "../entityFactories/newMushroom";
import newStar from "../entityFactories/newStar";
import newVine from "../entityFactories/newVine";
import smb1Sprites from "../sprites/smb1";
import Collidable from "../utils/collidable";
import worldGrid from "../world-grid";

function didHitHead(e: Entity) {
  const hits = e.hits;
  const prevHits = e.prevHits;
  if (hits && prevHits) {
    const hit = hits.find(h => h.normal.y > 0);

    if (hit && !prevHits.find(p => p.e === hit.e)) {
      if (hit.normal.y > 0) {
        return true;
      }
    }
  }
  return false;
}

const collider = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, -1)};
const collidee = new Collidable;
const bb = {l: 0, t: 0, w: 0, h: 0};

const hitAnimDuration = 0.4;

const audio = getSmb1Audio();
entities.onAdding(['grow'], () => {
  audio.sounds.play('powerup_appears', {stopPrev: {same: true}});
});

function cooldowns(dt: number) {
  for (const type of ['bonk', 'smash'] as ('bonk' | 'smash')[]) {
    const cooldownType = type === 'bonk' ? 'bonkCooldown' : 'smashCooldown';
  
    for (const m of entities.view([cooldownType])) {
      let cd = m[cooldownType];
      if (cd) {
        cd -= dt;
        m[cooldownType] = cd;
        if (cd < 0) {
          m[cooldownType] = 0;
        }
      }
    }
  
    for (const m of entities.view([type])) {
      if (m[type] && !m[cooldownType]) {
        m[cooldownType] = 0.1;
      }
    }
  }
}

export default function blockhit(dt: number) {
  cooldowns(dt);

  for (const b of entities.view(['bonked'])) {
    delete b.bonked;
  }

  for (const m of entities.view(['mario'])) {
    m.bonk = false;
    m.smash = false;
    if (!didHitHead(m)) continue;

    if (!m.dynamic) continue;
    const dr = collider.dr;

    const pos = m.position;
    const size = m.size;

    const l = pos.x - size.x * 0.5;
    const t = pos.y - size.y * 0.5;
    const w = size.x;
    const h = size.y;

    // Compute bounding box that contains rect both before and after movement
    bb.l = dr.x < 0 ? l + dr.x : l;
    bb.t = dr.y < 0 ? t + dr.y : t;
    bb.w = dr.x < 0 ? w - dr.x : w + dr.x;
    bb.h = dr.y < 0 ? h - dr.y : h + dr.y;

    collider.pos.x = l;
    collider.pos.y = t;
    collider.size.x = w;
    collider.size.y = h;

    for (const u of worldGrid.statics.findNear(bb.l, bb.t, bb.w, bb.h)) {
      const e = u.userData;
      if (e === m) continue;

      collidee.pos.x = u.l;
      collidee.pos.y = u.t;
      collidee.size.x = u.w;
      collidee.size.y = u.h;

      const [hit] = dynamicRectVsRect(collider, collidee);

      if (hit) {
        if (e.invisibleBlock) {
          delete e.invisibleBlock;
        }
        if (e.brick) {
          if (!m.mario?.big) {
            if (e.bonkCooldown) continue;
            e.bonked = true;
            if (e.hitAnim === undefined) e.hitAnim = 0;
            m.bonk = true;
          } else {
            if (e.smashCooldown) continue;
            e.bonked = true;
            const type = e.smb1TilesSprites?.getFrame().includes('2')
            ? 'brokenBrick2'
            : e.smb1TilesSprites?.getFrame().includes('3')
            ? 'brokenBrick3'
            : 'brokenBrick1';
            entities.remove(e);
            m.smash = true;
            const sizex4 = e.size.x / 4;
            const sizey4 = e.size.y / 4;
            newBrokenBrick(e.position.x - sizex4, e.position.y - sizey4, type, -1);
            newBrokenBrick(e.position.x - sizex4, e.position.y + sizey4, type, -1, -66);
            newBrokenBrick(e.position.x + sizex4, e.position.y - sizey4, type, +1);
            newBrokenBrick(e.position.x + sizex4, e.position.y + sizey4, type, +1, -66);
          }
        } else if (e.coinblock) {
          if (e.bonkCooldown) continue;
          e.bonked = true;
          if (e.coinblock !== 'coins') {
            if (e.coinblock === 'pow') {
              if (m.mario?.big) {
                newFireFlower(e.position.x, e.position.y);
              } else {
                newMushroom(e.position.x, e.position.y);
              }
            } else if (e.coinblock === 'life') {
              const mush = newMushroom(e.position.x, e.position.y);
              mush.powerup = false;
              mush.oneUp = true;
              mush.smb1ObjectsSprites?.setFrame('oneup');
            } else if (e.coinblock === 'star') {
              newStar(e.position.x, e.position.y);
            } else if (e.coinblock === 'vine') {
              if (e.vineCreator) newVine(e, e.vineCreator.h);
              delete e.vineCreator;
            } else {
              newCoinFromBlock(e.position.x, e.position.y);
              if (e.player) e.player.coins++;
            }
            delete e.coinblock;
            if (e.smb1TilesAnimations) {
              delete e.smb1TilesAnimations;
              const smb1TilesSprites = smb1Sprites.getFactory('tiles').new();
              e.smb1TilesSprites = smb1TilesSprites;
              smb1TilesSprites.setFrame('blockHit1');
            }
            if (e.smb1TilesSprites) {
              switch (e.smb1TilesSprites.getFrame()) {
                case "brick2":
                case "brickBottom2":
                  e.smb1TilesSprites.setFrame('blockHit2');
                  break;
                case "brick3":
                case "brickBottom3":
                  e.smb1TilesSprites.setFrame('blockHit3');
                  break;
                default:
                  e.smb1TilesSprites.setFrame('blockHit1');
              }
            }
          } else {
            newCoinFromBlock(e.position.x, e.position.y);
            if (e.player) e.player.coins++;

            if (e.coinblockDeathTimer === undefined) {
              e.coinblockDeathTimer = 3.8;
            }
          }
          if (e.hitAnim === undefined) e.hitAnim = 0;
          m.bonk = true;
        } else {
          if (e.bonkCooldown) continue;
          m.bonk = true;
        }
      }
    }

    for (const u of worldGrid.kinematics.findNear(bb.l, bb.t, bb.w, bb.h)) {
      const e = u.userData;
      if (e === m) continue;

      collidee.set(e);

      const [hit] = dynamicRectVsRect(collider, collidee);
      if (hit) {
        if (e.bonkCooldown) continue;
        m.bonk = true;
      }
    }
  }

  for (const e of entities.view(['coinblockDeathTimer'])) {
    if (e.coinblockDeathTimer !== undefined) {
      e.coinblockDeathTimer -= dt;
      if (e.coinblockDeathTimer <= 0) {
        delete e.coinblockDeathTimer;
        e.coinblock = 'coin';
      }
    }
  }

  for (const e of entities.view(['hitAnim'])) {
    if (e.hitAnim !== undefined) {
      const progress = e.hitAnim / hitAnimDuration;
      const dy = Math.sin(progress * Math.PI) * 8;
      if (e.smb1TilesSprites) {
        e.smb1TilesSprites.container.position.y = e.positionStart.y - dy;
      }
      e.hitAnim += dt;
      if (e.hitAnim > hitAnimDuration) {
        delete e.hitAnim;
        if (e.smb1TilesSprites) {
          e.smb1TilesSprites.container.position.y = e.positionStart.y
        }
      }
    }
  }

  const marios = entities.view(['mario'])

  for (const e of entities.view(['grow'])) {
    if (e.grow !== undefined) {
      if (e.grow >= 0) {
        const progress = e.grow / hitAnimDuration;
        const dy = Math.sin(progress * Math.PI) * 8;
        e.position.y = e.positionStart.y - dy;
        e.grow += dt;
        if (e.grow > hitAnimDuration / 2) {
          e.grow = -1;
        }
      } else {
        e.position.y = e.position.y - dt * 16;
        if (e.position.y - e.positionStart.y <= -16) {
          e.position.y = e.positionStart.y - 16;
          const closestMario = marios.length ? marios.reduce((a, c) => {
            if (Math.abs(a.position.x - e.position.x) > Math.abs(c.position.x - e.position.x)) {
              return c;
            } else {
              return a;
            }
          }) : null;
          const side = Math.sign((closestMario?.position.x ?? 0) - e.position.x);
          if (e.mushroom) {
            e.movement = {
              horizontal: 16 * 3 * side,
              horizontalNow: true
            }
            e.gravity = 333;
          }
          if (e.star) {
            e.movement = {
              horizontal: 16 * 3 * side,
              bounce: -200,
              horizontalNow: true
            }
            e.gravity = 333;
          }
          delete e.grow;
        }
      }
      if (e.smb1ObjectsSprites) {
        e.smb1ObjectsSprites.container.position.x = e.position.x;
        e.smb1ObjectsSprites.container.position.y = e.position.y;
      }
    }
  }

  for (const e of entities.view(['brokenBrick'])) {
    const bb = e.brokenBrick;
    if (bb) {
      e.position.x += bb.velocity.x * dt;
      e.position.y += bb.velocity.y * dt;

      bb.velocity.y += 700 * dt;
    }

    if (e.smb1TilesSprites) {
      e.smb1TilesSprites.container.position.x = e.position.x;
      e.smb1TilesSprites.container.position.y = e.position.y;
    }

    const [_, y] = display.fromViewport(0, display.getViewportHeight());
    const top = e.position.y - e.size.y * 0.5;
    if (top > y) {
      entities.remove(e);
    }
  }
}