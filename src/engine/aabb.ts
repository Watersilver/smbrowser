import Vec2d from "./Vec2d";

type Vec2dData = {
  x: number;
  y: number;
}

type RectData = {pos: Vec2dData; size: Vec2dData};
type Rect = {pos: Vec2d; size: Vec2d};
type DynamicRect = {pos: Vec2d; size: Vec2d; dr: Vec2d};
type Ray = {origin: Vec2d; direction: Vec2d};

export function pointVsRect(point: Vec2dData, rect: RectData) {
  if (point.x <= rect.pos.x) return false;
  if (point.x >= rect.pos.x + rect.size.x) return false;
  if (point.y <= rect.pos.y) return false;
  if (point.y >= rect.pos.y + rect.size.y) return false;
  return true;
}

export function rectVsRect(rect1: RectData, rect2: RectData) {
  if (rect1.pos.x + rect1.size.x <= rect2.pos.x) return false;
  if (rect1.pos.x >= rect2.pos.x + rect2.size.x) return false;
  if (rect1.pos.y + rect1.size.y <= rect2.pos.y) return false;
  if (rect1.pos.y >= rect2.pos.y + rect2.size.y) return false;
  return true;
}

export function rayVsRect(ray: Ray, rect: Rect):
[hit: false, contact: null] | [hit: true, contact: {point: Vec2d, normal: Vec2d, time: number, edginess: number}]
{
  // Reject if ray has no direction
  if (ray.direction.isNull) return [false, null];

  // Calculate intersections with rectangle bounding axes
  const tNear = rect.pos.sub(ray.origin).elementwiseDiv(ray.direction);
  const tFar = rect.pos.add(rect.size).sub(ray.origin).elementwiseDiv(ray.direction);

  // Sometimes we divide 0 by 0 and we get a NaN result (other numbers / 0 give +- Infinity which is fine)
  if (tNear.isNaN || tFar.isNaN) return [false, null];

  // Sort distances
  if (tNear.x > tFar.x) [tFar.x, tNear.x] = [tNear.x, tFar.x];
  if (tNear.y > tFar.y) [tFar.y, tNear.y] = [tNear.y, tFar.y];

  // Early rejection
  if (tNear.x > tFar.y || tNear.y > tFar.x) return [false, null];

  // Closest 'time' will be the first contact
  const tNearHit = Math.max(tNear.x, tNear.y);

  // Furthest 'time' is contact on opposite side of target
  const tFarHit = Math.min(tFar.x, tFar.y);

  // Reject if ray direction is pointing away from object
  if (tFarHit < 0) return [false, null];

  // Contact point of collision
  const point = ray.direction.mul(tNearHit).add(ray.origin);

  // adjustment: calculate how close to an edge each contact point is to sort collisions instead of sorting by contact time
  // Find out how close to an edge our point is
  const l1 = rect.pos.sub(point).length();
  const l2 = rect.pos.add(rect.size).sub(point).length();
  const l3 = rect.pos.add(new Vec2d(rect.size.x, 0)).sub(point).length();
  const l4 = rect.pos.add(new Vec2d(0, rect.size.y)).sub(point).length();
  const edginess = Math.min(l1, l2, l3, l4);

  // determine normal from ray direction
  let normal = new Vec2d(0, 0);
  if (tNear.x > tNear.y) {
    if (ray.direction.x < 0) {
      normal.x = 1;
    } else {
      normal.x = -1;
    }
  } else {
    if (ray.direction.y < 0) {
      normal.y = 1;
    } else {
      normal.y = -1;
    }
  }

  return [true, {
    point,
    normal,
    time: tNearHit,
    edginess
  }];
}

export function dynamicRectVsRect(rect1: DynamicRect, rect2: RectData):
[hit: false, contact: null] | [hit: true, contact: {point: Vec2d, normal: Vec2d, time: number, edginess: number}] {
  // Check if dynamic rectangle is actually moving - we assume rectangles are NOT in collision to start
  // rayVsRect would also reject but we can skip some operations if we do it here
  if (rect1.dr.isNull) return [false, null];

  // Expand target rectangle by source dimensions
  const pos = rect1.size.mul(-0.5).add(rect2.pos);
  const size = rect1.size.add(rect2.size);
  const expandedRect = {pos, size};

  const res = rayVsRect({
    origin: rect1.pos.add(rect1.size.div(2)),
    direction: rect1.dr
  }, expandedRect);

  if (res[0]) {
    // adjustment: accept small negative times, because otherwise I've noticed there is failure to collide sometimes
    if (res[1].time >= -1.1 && res[1].time < 1) return res;
    return [false, null];
  }

  return res;
}

export function dynamicRectVsDynamicRect(rect1: DynamicRect, rect2: DynamicRect):
[hit: false, contact: null] | [hit: true, contact: {point: Vec2d, normal: Vec2d, time: number, edginess: number}] {
  return dynamicRectVsRect({
    pos: rect1.pos,
    size: rect1.size,
    dr: rect1.dr.sub(rect2.dr)
  }, rect2);
}

const aabb = {
  pointVsRect,
  rectVsRect,
  rayVsRect,
  dynamicRectVsRect,
  dynamicRectVsDynamicRect
}

export default aabb;