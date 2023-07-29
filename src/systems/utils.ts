import { Vec2d } from "../engine";

const systemUtils = {
  speedLimiter(velocity: Vec2d) {
    const l = velocity.length();
    const max = 1000;
    if (l > max) {
      velocity = velocity.unit().mul(max);
      return velocity;
    }
  }
}

export default systemUtils;