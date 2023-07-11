type Vec2dData = {
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

  unit() {
    const divl = 1 / (this.isNull ? 1 : this.length());
    return new Vec2d(this.x * divl, this.y * divl);
  }

  project(v: Vec2dData) {
    const b = new Vec2d(v.x, v.y);
    if (b.isNull) return b;
    return this.dot(b.unit());
  }

  toPolar() {
    return new Vec2d(this.length(), Math.atan2(this.y, this.x));
  }

  toCartesian() {
    return new Vec2d(this.x * Math.cos(this.y), this.x * Math.sin(this.y));
  }
}
