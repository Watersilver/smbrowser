import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import smb1Sprites from "../sprites/smb1";

export default function newFireFlower(x: number, y: number) {
  const smb1ObjectsSprites = smb1Sprites.getFactory('objects').new();
  smb1ObjectsSprites.setFrame('flower');

  // Stay invisible for the first frame because will appear in front otherwise even though zIndex is -1
  smb1ObjectsSprites.container.visible = false;
  setTimeout(() => smb1ObjectsSprites.container.visible = true);
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y), size: new Vec2d(14, 16),
    smb1ObjectsSprites,
    grow: 0,
    dynamic: {
      velocity: new Vec2d(0, 0),
      acceleration: new Vec2d(0, 0)
    },
    powerup: true,
    hits: []
  }));
}