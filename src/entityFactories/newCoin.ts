import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import smb1Sprites from "../sprites/smb1";

export default function newCoin(x: number, y: number) {
  const smb1TilesAnimations = smb1Sprites.getFactory('animTiles').new();

  smb1TilesAnimations.setAnimation('coin');
  
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(10, 14),
    smb1TilesAnimations,
    sensor: true,
    coin: true,
  }));
}