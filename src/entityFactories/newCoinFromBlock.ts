import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import smb1Sprites from "../sprites/smb1";

export default function newCoinFromBlock(x: number, y: number) {
  const smb1ObjectsAnimations = smb1Sprites.getFactory('animObjects').new();
  smb1ObjectsAnimations.setAnimation('coin');
  smb1ObjectsAnimations.container.zIndex = -1;

  // Stay invisible for the first frame because will appear in front otherwise even though zIndex is -1
  smb1ObjectsAnimations.container.visible = false;
  setTimeout(() => smb1ObjectsAnimations.container.visible = true);
  smb1ObjectsAnimations.loopsPerSecond = 3;
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(8, 16),
    dynamic: {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)},
    smb1ObjectsAnimations,
    coinFromBlockLife: 0.8
  }));
}