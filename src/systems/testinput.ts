import { Input } from "../engine";
import entities, { Entity } from "../entities";

export default function testInput(e: Entity, i: Input) {
  if (!e.dynamic) return;
  e.dynamic.acceleration.x = 0;
  e.dynamic.acceleration.y = 0;
  if (i.isHeld("KeyA")) e.dynamic.acceleration.x = -100;
  if (i.isHeld("KeyD")) e.dynamic.acceleration.x = 100;
  if (i.isHeld("KeyW")) e.dynamic.acceleration.y = -100;
  if (i.isHeld("KeyS")) e.dynamic.acceleration.y = 100;
}