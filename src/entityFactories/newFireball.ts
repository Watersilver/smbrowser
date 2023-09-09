import { Vec2d } from "../engine";
import entities, { Entity, newEntity } from "../entities";
import smb1Sprites from "../sprites/smb1";

export default function newFireball(x: number, y: number, parent: Entity, startVelocity: number) {
  const a = smb1Sprites.getFactory('animObjects').new();
  a.setAnimation('fireball');
  a.loopsPerSecond = 3;
  a.container.zIndex = 10;
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(8, 8),
    dynamic: {
      acceleration: new Vec2d(0, 0),
      velocity: new Vec2d(startVelocity, 0)
    },
    touchingLeft: [],
    touchingRight: [],
    touchingDown: [],
    smb1ObjectsAnimations: a,
    fireball: {parent, startVelocity},
    gravity: 777
  }));
}