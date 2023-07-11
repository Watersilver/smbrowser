import Vec2d from "./Vec2d";

type Vec2dData = {
  x: number;
  y: number;
}

export default class AABB {
  pos: Vec2d;
  size: Vec2d;

  constructor(l: number, t: number, w: number, h: number) {
    this.pos = new Vec2d(l, t);
    this.size = new Vec2d(w, h);
  }

  contains(point: Vec2dData) {
    if (point.x < this.pos.x) return false;
    if (point.x > this.pos.x + this.size.x) return false;
    if (point.y < this.pos.y) return false;
    if (point.y > this.pos.y + this.size.y) return false;
    return true;
  }

  overlaps(rect: {pos: Vec2dData; size: Vec2dData}) {
    if (this.pos.x >= rect.pos.x + rect.size.x) return false;
    if (this.pos.y >= rect.pos.y + rect.size.y) return false;
    if (rect.pos.x >= this.pos.x + this.size.x) return false;
    if (rect.pos.y >= this.pos.y + this.size.y) return false;
    return true;
  }

  vsRay(ray: {origin: Vec2dData; direction: Vec2dData}):
  [hit: false, contact: null, t: null]
  | [hit: true, contact: {point: Vec2d, normal: Vec2d}, t: number]
  {
    if (!ray.direction.x && !ray.direction.y) return [false, null, null];

    // Calculate intersections with rectangle bounding axes
    const tNear = this.pos.sub(ray.origin).elementwiseDiv(ray.direction);
    const tFar = this.pos.add(this.size).sub(ray.origin).elementwiseDiv(ray.direction);

    // Sometimes we divide 0 by 0 and we get a NaN result (other numbers / 0 give +- Infinity which is fine)
    if (tNear.isNaN || tFar.isNaN) return [false, null, null];

    // Sort distances
    if (tNear.x > tFar.x) [tFar.x, tNear.x] = [tNear.x, tFar.x];
    if (tNear.y > tFar.y) [tFar.y, tNear.y] = [tNear.y, tFar.y];

    // Early rejection
    if (tNear.x > tFar.y || tNear.y > tFar.x) return [false, null, null];

    // Closest 'time' will be the first contact
    const tNearHit = Math.max(tNear.x, tNear.y);

    // Furthest 'time' is contact on opposite side of target
    const tFarHit = Math.min(tFar.x, tFar.y);

    // Reject if ray direction is pointing away from object
    if (tFarHit < 0) return [false, null, null];

    // Note if collision is principly in a diagonal returned normal is (0, 0).
    // (TODO: doesn't fix issue completelly, does a little stutter, deletioin pending unless we face some issue)
    let normal = new Vec2d(0, 0);
    if (tNear.x > tNear.y) {
      if (ray.direction.x < 0) {
        normal.x = 1;
      } else {
        normal.x = -1;
      }
    } else {
    // } else if (tNear.x < tNear.y) {
      if (ray.direction.y < 0) {
        normal.y = 1;
      } else {
        normal.y = -1;
      }
    }

    return [true, {
      // Contact point of collision from parametric line equation
      point: new Vec2d(ray.direction.x, ray.direction.y).mul(tNearHit).add(ray.origin),
      normal
    }, tNearHit];
  }

  willCollide(posDisplacement: Vec2dData, rect: {pos: Vec2dData; size: Vec2dData}):
  [hit: false, contact: null, t: null]
  | [hit: true, contact: {point: Vec2d, normal: Vec2d}, t: number] {
    // Check if dynamic rectangle is actually moving - we assume rectangles are NOT in collision to start
    if (!posDisplacement.x && !posDisplacement.y) return [false, null, null];

    // Expand target rectangle by source dimensions
    const pos = this.size.mul(-0.5).add(rect.pos);
    const size = this.size.add(rect.size);
    const expandedRect = new AABB(pos.x, pos.y, size.x, size.y);

    const res = expandedRect.vsRay({
      origin: this.pos.add(this.size.div(2)),
      direction: posDisplacement
    }); // new stuff

    if (res[0]) {
      if (res[2] >= 0 && res[2] < 1) return res;
      return [false, null, null];
    } else {
      return res;
    }

    // return expandedRect.vsRay({
    //   origin: this.pos.add(this.size.div(2)),
    //   direction: posDisplacement
    // });
  }
}