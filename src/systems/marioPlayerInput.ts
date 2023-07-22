import { Input } from "../engine";
import entities from "../entities";

export default function marioPlayerInput(keyboard: Input) {
  for (const e of entities.view(['marioInput', 'player'])) {
    const i = e.marioInput;
    if (i) {
      for (const key in i) {
        (<any>i)[key] = false;
      }
      if (keyboard.isHeld("ArrowLeft")) i.left = true;
      if (keyboard.isHeld("ArrowRight")) i.right = true;
      if (keyboard.isHeld("KeyC")) i.run = true;
      if (keyboard.isPressed("KeyC")) i.attack = true;
      if (keyboard.isPressed("KeyX")) i.jump = true;
      if (keyboard.isHeld("KeyX")) i.jumping = true;
    }
  }
}