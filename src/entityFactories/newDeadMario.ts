import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import smb1Sprites from "../sprites/smb1";

function rand() {
  return Math.random() * 2 - 1;
}

export default function newDeadMario(x: number, y: number) {
  const smb1MarioAnimations = smb1Sprites.getFactory('mario').new();
  smb1MarioAnimations.setAnimation('smallDie');
  smb1MarioAnimations.container.zIndex = 10;
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(12, 15),
    dynamic: {
      velocity: new Vec2d(rand() * 66, -150 * Math.random() - 50),
      acceleration: new Vec2d(0, 0)
    },
    goThrougWalls: true,
    gravity: 600,
    angVel: rand() * 360,
    smb1MarioAnimations,
    deleteOutOfCam: true
  }));
}