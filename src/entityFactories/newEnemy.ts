import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1EnemiesAnimations } from "../sprites/loaders/smb1/enemies";
import smb1Sprites from "../sprites/smb1";

export default function newEnemy(x: number, y: number, frame?: Smb1EnemiesAnimations['animation']) {
  const smb1EnemiesAnimations = smb1Sprites.getFactory('enemies').new();
  smb1EnemiesAnimations.setAnimation(frame || 'goomba');

  y = y - smb1EnemiesAnimations.container.height * 0.5 + 8;
  smb1EnemiesAnimations.container.zIndex = 2;

  if (frame === 'goomba') {
    smb1EnemiesAnimations.loopsPerSecond = 4;
    return entities.createEntity(newEntity({
      position: new Vec2d(x, y),
      size: new Vec2d(14, 14),
      smb1EnemiesAnimations,
      enemActivateOnVisible: 'goomba'
    }));
  }
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(8, 16),
    dynamic: {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)},
    smb1EnemiesAnimations
  }));
}