import { Vec2d } from "../engine";
import { Vec2dData } from "../engine/Vec2d";

export default class Collidable {
  l = 0;
  t = 0;
  w = 0;
  h = 0;

  private bb = {
    l: 0,
    t: 0,
    w: 0,
    h: 0
  };

  pos = new Vec2d(0, 0);
  size = new Vec2d(0, 0);
  dr = new Vec2d(0, 0);

  set(data: {position: Vec2dData, size: Vec2dData, dynamic?: {velocity: Vec2dData}}, dt?: number) {
    this.l = data.position.x - data.size.x * 0.5;
    this.t = data.position.y - data.size.y * 0.5;
    this.w = data.size.x;
    this.h = data.size.y;

    this.pos.x = this.l;
    this.pos.y = this.t;
    this.size.x = this.w;
    this.size.y = this.h;

    if (dt && data.dynamic) {
      this.dr.x = data.dynamic.velocity.x * dt;
      this.dr.y = data.dynamic.velocity.y * dt;
    }
  }

  computeBoundingBox() {
    this.bb.l = this.dr.x < 0 ? this.l + this.dr.x : this.l;
    this.bb.t = this.dr.y < 0 ? this.t + this.dr.y : this.t;
    this.bb.w = this.dr.x < 0 ? this.w - this.dr.x : this.w + this.dr.x;
    this.bb.h = this.dr.y < 0 ? this.h - this.dr.y : this.h + this.dr.y;

    return this.bb;
  }

  get boundingBox(): {
    readonly l: number;
    readonly t: number;
    readonly w: number;
    readonly h: number;
  } {
    return this.bb;
  }
}