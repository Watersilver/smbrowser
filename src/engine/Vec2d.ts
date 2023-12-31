export type Vec2dData = {
  x: number;
  y: number;
}

export default class Vec2d implements Vec2dData {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get r() {return this.x;}
  get th() {return this.y;}

  get isNull() {
    return this.x === 0 && this.y === 0;
  }

  get isNaN() {
    return Number.isNaN(this.y + this.x);
  }

  set(v: Vec2dData) {
    this.x = v.x;
    this.y = v.y;
  }

  abs() {
    return new Vec2d(Math.abs(this.x), Math.abs(this.y));
  }

  negate() {
    return new Vec2d(-this.x, -this.y);
  }

  add(v: Vec2dData) {
    return new Vec2d(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2dData) {
    return new Vec2d(this.x - v.x, this.y - v.y);
  }

  elementwiseMul(v: Vec2dData) {
    return new Vec2d(this.x * v.x, this.y * v.y);
  }

  elementwiseDiv(v: Vec2dData) {
    return new Vec2d(this.x / v.x, this.y / v.y);
  }

  mul(s: number) {
    return new Vec2d(this.x * s, this.y * s);
  }

  div(s: number) {
    return new Vec2d(this.x / s, this.y / s);
  }

  dot(v: Vec2dData) {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vec2dData) {
    return this.x * v.y - this.y * v.x;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  distanceSquared(other: Vec2dData) {
    return (this.x - other.x) ** 2 + (this.y - other.y) ** 2;
  }

  distance(other: Vec2dData) {
    return Math.sqrt(this.distanceSquared(other));
  }

  unit() {
    const divl = 1 / (this.isNull ? 1 : this.length());
    return new Vec2d(this.x * divl, this.y * divl);
  }

  /* Vector scaled so its biggest component becomes one while the other remains proportional */
  scaledTo1() {
    if (this.x === this.y) {
      if (this.isNull) return new Vec2d(0, 0);
      return new Vec2d(this.x / Math.abs(this.x), this.y / Math.abs(this.y));
    } else if (Math.abs(this.x) < Math.abs(this.y)) {
      if (this.x === 0) return new Vec2d(0, Math.sign(this.y));
      const ratio = Math.abs(this.x) / Math.abs(this.y);
      return new Vec2d(ratio * Math.sign(this.x), Math.sign(this.y));
    } else {
      if (this.y === 0) return new Vec2d(Math.sign(this.x), 0);
      const ratio = Math.abs(this.y) / Math.abs(this.x);
      return new Vec2d(Math.sign(this.x), ratio * Math.sign(this.y));
    }
  }

  project(v: Vec2dData) {
    const b = new Vec2d(v.x, v.y);
    if (b.isNull) return b;
    return this.dot(b.unit());
  }

  equals(v: Vec2dData) {
    return this.x === v.x && this.y === v.y;
  }

  /** x = r, y = theta */
  toPolar() {
    return new Vec2d(this.length(), Math.atan2(this.y, this.x));
  }

  toCartesian() {
    return new Vec2d(this.x * Math.cos(this.y), this.x * Math.sin(this.y));
  }
}
