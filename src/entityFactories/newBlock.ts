import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { smb1Sprites } from "../sprites/smb";

export default function newBlock(x: number, y: number) {
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y), size: new Vec2d(16, 16), static: true
  }));
}