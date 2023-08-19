import { Vec2d } from "../engine";
import { dynamicRectVsRect } from "../engine/aabb";
import entities from "../entities";
import smb1Sprites from "../sprites/smb1";
import worldGrid from "../world-grid";
import didHitHead from "./utils/didHitHead";

const collider = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, -1)};
const collidee = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0)};
const bb = {l: 0, t: 0, w: 0, h: 0};

const hitAnimDuration = 0.4;

export default function blockhit(dt: number) {
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
            if (e.hitAnim === undefined) e.hitAnim = 0;
            m.bonk = true;
          } else {
            entities.remove(e);
            m.smash = true;
            // TODO: add crashed block parts
            // TODO: add sound
          }
        } else if (e.coinblock) {
          // TODO: Add whatever bonus stuff is in blocks
          if (e.coinblock !== 'coins') {
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
            if (e.coinblockDeathTimer === undefined) {
              e.coinblockDeathTimer = 3.8;
            }
          }
          if (e.hitAnim === undefined) e.hitAnim = 0;
          m.bonk = true;
        } else {
          m.bonk = true;
        }
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
}