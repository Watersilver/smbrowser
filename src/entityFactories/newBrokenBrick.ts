import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1TilesSprites } from "../sprites/loaders/smb1/tiles";
import smb1Sprites from "../sprites/smb1";

export default function newBrokenBrick(x: number, y: number, frame?: Smb1TilesSprites['frame'], side?: 1 | -1, speed?: number) {
  const smb1TilesSprites = smb1Sprites.getFactory('tiles').new();
  smb1TilesSprites.setFrame(frame ?? 'brokenBrick1');
  smb1TilesSprites.container.zIndex = 1;
  side = side || 1;
  if (side === 1) {
    smb1TilesSprites.container.scale.x = -1;
  }
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y), size: new Vec2d(8, 8),
    brokenBrick: {
      side,
      velocity: new Vec2d(side * 50, speed || -266)
    },
    smb1TilesSprites
  }));
}