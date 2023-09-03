import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1ObjectsSprites } from "../sprites/loaders/smb1/objects";
import smb1Sprites from "../sprites/smb1";

export default function newPlatform(x: number, y: number, frame?: Smb1ObjectsSprites['frame']) {
  const smb1ObjectsSprites = smb1Sprites.getFactory('objects').new();
  smb1ObjectsSprites.setFrame(frame ?? 'platformBig');
  const sizeX =
    smb1ObjectsSprites.getFrame().includes('Big') ? 48
    : smb1ObjectsSprites.getFrame().includes('Medium') ? 32
    : smb1ObjectsSprites.getFrame().includes('Small') ? 24
    : 16;

  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(sizeX, 8),
    kinematic: {
      velocity: new Vec2d(0, 0),
      acceleration: new Vec2d(0, 0)
    },
    smb1ObjectsSprites,
    platform: {crumble: true},
    touchingUp: []
  }));
}