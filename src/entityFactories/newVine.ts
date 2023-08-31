import { Vec2d } from "../engine";
import entities, { Entity, newEntity } from "../entities";

export default function newVine(root: Entity, height: number) {
  return entities.createEntity(newEntity({
    position: new Vec2d(root.position.x, root.position.y),
    size: new Vec2d(1, 0),
    vine: {
      targetHeight: height,
      root,
      parts: [],
    },
    vineStart: true,
    sensor: true,
    moving: true
  }));
}