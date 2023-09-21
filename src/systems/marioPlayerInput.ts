import { Input, aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import zones from "../zones";

const ZoneRect = new Collidable();

export default function marioPlayerInput(keyboard: Input, dt: number) {
  for (const e of entities.view(['marioInput', 'player'])) {
    const mi = e.marioInput;
    if (mi) {
      mi.anyPressed = false;
      const i = mi.inputs;
      for (const key in i) {
        if (typeof (<any>i)[key] === "number") {
          (<any>i)[key] -= dt;
          if ((<any>i)[key] < 0) (<any>i)[key] = 0;
        } else {
          (<any>i)[key] = false;
        }
      }

      if (zones.noInput.some(z => aabb.pointVsRect(e.position, ZoneRect.setToZone(z)))) {
        continue;
      }

      if (keyboard.isPressed("ArrowLeft")) {
        mi.anyPressed = true;
        i.left = true;
        i.leftPress = true;
      }
      if (keyboard.isHeld("ArrowLeft")) i.left = true;
      if (keyboard.isPressed("ArrowRight")) {
        mi.anyPressed = true;
        i.right = true;
        i.rightPress = true;
      }
      if (keyboard.isHeld("ArrowRight")) i.right = true;
      if (i.right && i.left) {
        i.right = false;
        i.left = false;
        i.leftPress = true;
        i.rightPress = true;
      }
      if (keyboard.isPressed("ArrowDown")) {
        mi.anyPressed = true;
        i.ducking = true;
      }
      if (keyboard.isHeld("ArrowDown")) i.ducking = true;

      if (keyboard.isHeld("KeyC")) i.run = 1 / 6;
      if (keyboard.isPressed("KeyC")) {
        i.attack = true;
        mi.anyPressed = true;
        i.run = 1 / 6;
      }
      if (keyboard.isPressed("KeyX")) {
        i.jump = true;
        i.jumping = true;
        mi.anyPressed = true;
      }
      if (keyboard.isHeld("KeyX")) i.jumping = true;

      if (keyboard.isPressed("ArrowUp")) {
        mi.anyPressed = true;
        i.climbUp = true;
      }
      if (keyboard.isHeld("ArrowUp")) i.climbUp = true;

      if (keyboard.isPressed("ArrowDown")) {
        mi.anyPressed = true;
        i.climbDown = true;
      }
      if (keyboard.isHeld("ArrowDown")) i.climbDown = true;
    }
  }
}