import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import smb1Sprites from "../sprites/smb1";

export default function newBlock(x: number, y: number) {
  const smb1TilesSprites = smb1Sprites.getFactory('tiles').new();
  smb1TilesSprites.setFrame('block');
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y), size: new Vec2d(16, 16), static: true,
    smb1TilesSprites
  }));
}