import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1TilesSprites } from "../sprites/loaders/smb1/tiles";
import smb1Sprites from "../sprites/smb1";

export default function newBrick(x: number, y: number, frame?: Smb1TilesSprites['frame']) {
  const smb1TilesSprites = smb1Sprites.getFactory('tiles').new();
  smb1TilesSprites.setFrame(frame ?? 'brick1');
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y), size: new Vec2d(16, 16), static: true,
    brick: true,
    smb1TilesSprites
  }));
}