import { Vec2d } from "../engine";
import { dynamicRectVsDynamicRect, dynamicRectVsRect } from "../engine/aabb";
import entities, { Entity } from "../entities";
import worldGrid from "../world-grid";
import storePrevHits from "./storePrevHits";

const collider = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};
const collidee = {pos: new Vec2d(0, 0), size: new Vec2d(0, 0), dr: new Vec2d(0, 0)};

function addRemoveToSHT(type: "dynamic" | "static" | "kinematic") {
  const worldGridType = type === "dynamic" ? "dynamics" : type === "static" ? "statics" : "kinematics";
  const indexType = type === "dynamic" ? "dynamicIndex" : type === "static" ? "staticIndex" : "kinematicIndex";

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
    if (last) {
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

export default function physics(dt: number) {
  storePrevHits();

  for (const k of kinematicList) {
    if (!k.userData.kinematic) continue;

    if (!k.userData.kinematic.velocity.isNull) {
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

    // Store potential collisions
    const collisions: [edginess: number, u: {l: number, t: number, w: number, h: number, userData: Entity}][] = [];
    for (const u of worldGrid.statics.findNear(d.l, d.t, d.w, d.h)) {
      if (u === d) continue;

      collidee.pos.x = u.l;
      collidee.pos.y = u.t;
      collidee.size.x = u.w;
      collidee.size.y = u.h;

      const [hit, col] = dynamicRectVsRect(collider, collidee);

      if (hit) {
        collisions.push([col.edginess, u]);
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
        collisions.push([col.edginess, u]);
      }
    }

    // sort collisions by closest
    const sorted = collisions
    // using edginess (how close to an edge our collision point is)
    // adjusted: was collision time, but some times it would be zero and still resulted in getting stuck to edges
    .sort((a, b) => b[0] - a[0]);

    // resolve collisions
    // const collisionVelCorrection = new Vec2d(0, 0);
    for (const [_, u] of sorted) {
      const updatedDr = d.userData.dynamic.velocity.mul(dt);;
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
          if (d.userData.hits) d.userData.hits.push({e: u.userData, normal: col.normal, point: col.point});
          if (u.userData.hits) u.userData.hits.push({e: u.userData, normal: col.normal, point: col.point});
        }
      } else {
        collidee.pos.x = u.l;
        collidee.pos.y = u.t;
        collidee.size.x = u.w;
        collidee.size.y = u.h;
        const [hit, col] = dynamicRectVsRect(collider, collidee);
        if (hit) {
          const correction = d.userData.dynamic.velocity.abs().elementwiseMul(col.normal).mul(1-col.time);
          d.userData.dynamic.velocity.x += correction.x;
          d.userData.dynamic.velocity.y += correction.y;
          // collisionVelCorrection.x += correction.x;
          // collisionVelCorrection.y += correction.y;
          if (d.userData.hits) d.userData.hits.push({e: u.userData, normal: col.normal, point: col.point});
          if (u.userData.hits) u.userData.hits.push({e: u.userData, normal: col.normal, point: col.point});
        }
      }
    }
    // if (store correction maybe) {
    //   d.userData.dynamicVelocityComponents['collisionCorrection'] = collisionVelCorrection;
    // }
  }
}