import { Vec2d } from "../engine";
import { dynamicRectVsDynamicRect, dynamicRectVsRect } from "../engine/aabb";
import entities, { Entity } from "../entities";
import worldGrid from "../world-grid";
import storePrevHits from "./storePrevHits";

const collider = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};
const collidee = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};

function addRemoveToSHT(type: "dynamic" | "static" | "kinematic" | "sensor") {
  const worldGridType = type === "dynamic" ? "dynamics" : type === "static" ? "statics" : type === 'sensor' ? 'sensors' : "kinematics";
  const indexType = type === "dynamic" ? "dynamicIndex" : type === "static" ? "staticIndex" : type === 'sensor' ? 'sensorIndex' : "kinematicIndex";

  const list: ReturnType<typeof worldGrid[keyof typeof worldGrid]['create']>[] = [];

  entities.onAdding([type], e => {
    const u = worldGrid[worldGridType].create(e.position.x - e.size.x * 0.5, e.position.y - e.size.y * 0.5, e.size.x, e.size.y, e);
    const l = list.push(u);
    e[indexType] = l - 1;
  });

  entities.onRemoving([type], e => {
    const u = list[e[indexType]];
    if (u?.userData !== e) throw Error("what");
    worldGrid[worldGridType].remove(u);

    const last = list.at(-1);
    list.pop();
    if (last && last !== u) {
      list[e[indexType]] = last;
      last.userData[indexType] = e[indexType];
    };
    e[indexType] = -1;
  });

  return list;
}

const dynamicsList = addRemoveToSHT('dynamic');
addRemoveToSHT('static');
const kinematicList = addRemoveToSHT('kinematic');
const sensorsList = addRemoveToSHT('sensor');

export default function physics(dt: number) {
  storePrevHits();

  for (const e of entities.view(['sensor', 'moving'])) {
    const s = sensorsList.at(e.sensorIndex);
    if (!s) continue;

    const pos = e.position;
    const size = e.size;

    s.l = pos.x - size.x * 0.5;
    s.t = pos.y - size.y * 0.5;
    s.w = size.x;
    s.h = size.y;

    worldGrid.sensors.update(s);
  }

  for (const k of kinematicList) {
    if (!k.userData.kinematic) continue;

    const pos = k.userData.position;
    const size = k.userData.size;
    const dr = k.userData.kinematic.velocity.mul(dt);

    k.l = pos.x - size.x * 0.5;
    k.t = pos.y - size.y * 0.5;
    k.w = size.x;
    k.h = size.y;

    // Compute bounding box that contains rect both before and after movement
    k.l = dr.x < 0 ? k.l + dr.x : k.l;
    k.t = dr.y < 0 ? k.t + dr.y : k.t;
    k.w = dr.x < 0 ? k.w - dr.x : k.w + dr.x;
    k.h = dr.y < 0 ? k.h - dr.y : k.h + dr.y;

    worldGrid.kinematics.update(k);
  }

  for (const d of dynamicsList) {
    if (!d.userData.dynamic) continue;

    const dr = d.userData.dynamic.velocity.mul(dt);

    if (dr.isNull) continue;

    const pos = d.userData.position;
    const size = d.userData.size;

    const l = pos.x - size.x * 0.5;
    const t = pos.y - size.y * 0.5;
    const w = size.x;
    const h = size.y;

    // Compute bounding box that contains rect both before and after movement
    d.l = dr.x < 0 ? l + dr.x : l;
    d.t = dr.y < 0 ? t + dr.y : t;
    d.w = dr.x < 0 ? w - dr.x : w + dr.x;
    d.h = dr.y < 0 ? h - dr.y : h + dr.y;

    worldGrid.dynamics.update(d);

    collider.pos.x = l;
    collider.pos.y = t;
    collider.size.x = w;
    collider.size.y = h;
    collider.dr.x = dr.x;
    collider.dr.y = dr.y;

    // Hatchet job fix for collision funkiness on corners when jumping
    // if (d.userData.mario?.jumped) {
    //   collider.size.y--;
    // }

    // Store potential collisions
    const collisions: [edginess: number, u: {l: number, t: number, w: number, h: number, userData: Entity}, time: number][] = [];
    for (const u of worldGrid.statics.findNear(d.l, d.t, d.w, d.h)) {
      if (u === d) continue;

      collidee.pos.x = u.l;
      collidee.pos.y = u.t;
      collidee.size.x = u.w;
      collidee.size.y = u.h;

      const [hit, col] = dynamicRectVsRect(collider, collidee);

      if (hit) {
        collisions.push([col.edginess, u, col.time]);
      }
    }
    for (const u of worldGrid.kinematics.findNear(d.l, d.t, d.w, d.h)) {
      if (u === d || !u.userData.kinematic) continue;

      collidee.pos.x = u.userData.position.x - u.userData.size.x * 0.5;
      collidee.pos.y = u.userData.position.y - u.userData.size.y * 0.5;
      collidee.size.x = u.userData.size.x;
      collidee.size.y = u.userData.size.y;
      collidee.dr.x = u.userData.kinematic.velocity.x * dt;
      collidee.dr.y = u.userData.kinematic.velocity.y * dt;

      const [hit, col] = dynamicRectVsDynamicRect(collider, collidee);

      if (hit) {
        collisions.push([col.edginess, u, col.time]);
      }
    }

    // let wut = false;

    // sort collisions by closest
    const sorted = collisions
    // using time
    .sort((a, b) => a[2] - b[2])
    // using edginess (how close to a corner our collision point is)
    // adjusted: was collision time, but some times it would be zero and still resulted in getting stuck to edges
    .sort((a, b) => b[0] - a[0]);

    // Hatchet job fix for collision funkiness on corners when landing
    // Problem must be caused by floating point error.
    // After a vertical collision has been resolved we get another
    // collision with an object of the same top coordinate
    // presumably because of the error in the updatedDr calculation:
    // const updatedDr = d.userData.dynamic.velocity.mul(dt);
    // fix by ignoring all top coordinates greater than resolved
    // for normals that point up and ignoring all bottoms lesser
    // than resolved otherwise. Note that this again introduces
    // floating point error. However if the collided entities have
    // exactly the same dimensions this doesn't cause problems.
    let verticalResolvedY: number | null = null;
    let verticalResolvedNormal = 0;

    // resolve collisions
    // const collisionVelCorrection = new Vec2d(0, 0);
    for (const [_, u] of sorted) {
      const updatedDr = d.userData.dynamic.velocity.mul(dt);
      collider.dr.x = updatedDr.x;
      collider.dr.y = updatedDr.y;

      if (u.userData.kinematic) {
        collidee.pos.x = u.userData.position.x - u.userData.size.x * 0.5;
        collidee.pos.y = u.userData.position.y - u.userData.size.y * 0.5;
        collidee.size.x = u.userData.size.x;
        collidee.size.y = u.userData.size.y;
        collidee.dr.x = u.userData.kinematic.velocity.x * dt;
        collidee.dr.y = u.userData.kinematic.velocity.y * dt;
        const [hit, col] = dynamicRectVsDynamicRect(collider, collidee);
        if (hit) {
          const correction = d.userData.dynamic.velocity
            .sub(u.userData.kinematic.velocity).abs().elementwiseMul(col.normal).mul(1-col.time);
          d.userData.dynamic.velocity.x += correction.x;
          d.userData.dynamic.velocity.y += correction.y;
          // collisionVelCorrection.x += correction.x;
          // collisionVelCorrection.y += correction.y;
          if (d.userData.hits) d.userData.hits.push({e: u.userData, ...col});
          if (u.userData.hits) u.userData.hits.push({e: d.userData, ...col});
        }
      } else {
        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;

        // Ignore collision if already vertically resolved for this height
        if (verticalResolvedNormal && verticalResolvedY !== null) {
          if (verticalResolvedNormal < 0) {
            if (collidee.pos.y >= verticalResolvedY) continue;
          } else {
            if (collidee.pos.y + collidee.size.y <= verticalResolvedY) continue;
          }
        }

        const [hit, col] = dynamicRectVsRect(collider, collidee);
        if (hit) {
          if (u.userData.invisibleBlock) {
            if (!(col.normal.y > 0)) continue;
          }

          verticalResolvedNormal = Math.sign(col.normal.y);
          if (verticalResolvedNormal < 0) {
            verticalResolvedY = collidee.pos.y;
          } else if (verticalResolvedNormal > 0) {
            verticalResolvedY = collidee.pos.y + collidee.size.y;
          } else {
            verticalResolvedY = null;
          }

          const correction = d.userData.dynamic.velocity.abs().elementwiseMul(col.normal).mul(1-col.time);
          d.userData.dynamic.velocity.x += correction.x;
          d.userData.dynamic.velocity.y += correction.y;

          // if (Math.abs(correction.x) > 0) {
          //   wut = true
          // }

          // collisionVelCorrection.x += correction.x;
          // collisionVelCorrection.y += correction.y;
          if (d.userData.hits) d.userData.hits.push({e: u.userData, ...col});
          if (u.userData.hits) u.userData.hits.push({e: d.userData, ...col});
        }
      }
    }

    // if (wut && d.userData.hits) {
    //   console.log(verticalResolvedNormal, verticalResolvedY, ...d.userData.hits);
    // }

    // if (store correction maybe) {
    //   d.userData.dynamicVelocityComponents['collisionCorrection'] = collisionVelCorrection;
    // }
  }
}