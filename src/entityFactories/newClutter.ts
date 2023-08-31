import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1ObjectsSprites } from "../sprites/loaders/smb1/objects";
import { Smb1TilesSprites } from "../sprites/loaders/smb1/tiles";
import smb1Sprites from "../sprites/smb1";

export default function newClutter(x: number, y: number, config: {
  type: "tile";
  frame?: Smb1TilesSprites['frame'];
} | {
  type: "object";
  frame?: Smb1ObjectsSprites['frame'];
}) {
  if (config.type === 'tile') {
    const smb1TilesSprites = smb1Sprites.getFactory('tiles').new();
    smb1TilesSprites.setFrame(config.frame ?? 'clutterGreenPipeBodyHorizontalBotton');
    return entities.createEntity(newEntity({
      position: new Vec2d(x, y), size: new Vec2d(16, 16),
      smb1TilesSprites
    }));
  } else {
    const smb1ObjectsSprites = smb1Sprites.getFactory('objects').new();
    smb1ObjectsSprites.setFrame(config.frame ?? 'vine');
    return entities.createEntity(newEntity({
      position: new Vec2d(x, y), size: new Vec2d(16, 16),
      smb1ObjectsSprites
    }));
  }
}