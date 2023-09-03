import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import smb1Sprites from "../sprites/smb1";

export default function newTrampoline(x: number, y: number, h: number) {
  const smb1ObjectsAnimations = smb1Sprites.getFactory('animObjects').new();
  smb1ObjectsAnimations.setAnimation('spring');
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y - 8),
    size: new Vec2d(16, 32),
    static: true,
    smb1ObjectsAnimations,
    spring: {h},
    touchingUp: [],
    hits: []
  }));
}