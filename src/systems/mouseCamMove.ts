import { Display } from "../display";
import { Input, Vec2d } from "../engine";

export default function mouseCamMove(
  dt: number,
  display: Display,
  input: Input,
  obj: {
    scale: number;
    mouseX: number;
    mouseY: number;
    mousePrevX: number;
    mousePrevY: number;
    spanVel: Vec2d;
  }
) {
  const prevScale = obj.scale;

  obj.mousePrevX = obj.mouseX;
  obj.mousePrevY = obj.mouseY;
  [obj.mouseX, obj.mouseY] = display.getMouseViewportPos();

  if (input.isHeld("MouseSecondary")) {
    const [px, py] = display.fromViewport(obj.mousePrevX, obj.mousePrevY);
    const [x, y] = display.fromViewport(obj.mouseX, obj.mouseY);
    obj.spanVel.x = (px - x) / dt;
    obj.spanVel.y = (py - y) / dt;
  } else {
    obj.spanVel = obj.spanVel.sub(obj.spanVel.mul(0.1));
  }

  const camCenterX = display.getCenterX();
  const camCenterY = display.getCenterY();

  display.setCenter(
    camCenterX + obj.spanVel.x * dt,
    camCenterY + obj.spanVel.y * dt
  );

  const w = input.getWheel();
  if (w) {
    if (w.deltaY < 0) {
      // obj.scale += 0.1;
      obj.scale *= 1.1;
    } else {
      // obj.scale -= 0.1;
      obj.scale /= 1.1;
    }
    if (obj.scale < 0.1) obj.scale = 0.1;
  }

  if (prevScale !== obj.scale) {
    const [px, py] = display.getMousePos();
    display.setScale(obj.scale);
    const [x, y] = display.getMousePos();

    display.setCenter(
      display.getCenterX() + px - x,
      display.getCenterY() + py - y
    );
  }
}