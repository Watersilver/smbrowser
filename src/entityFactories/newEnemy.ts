import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1EnemiesAnimations } from "../sprites/loaders/smb1/enemies";
import smb1Sprites from "../sprites/smb1";

export default function newEnemy(x: number, y: number, frame?: Smb1EnemiesAnimations['animation']) {
  const smb1EnemiesAnimations = smb1Sprites.getFactory('enemies').new();
  smb1EnemiesAnimations.setAnimation(frame || 'goomba');

  let height = 14;

  y = y + 8 - height * 0.5;
  smb1EnemiesAnimations.container.zIndex = 2;
  smb1EnemiesAnimations.loopsPerSecond = 4;
  
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(14, height),
    smb1EnemiesAnimations,
    enemActivateOnVisible:
      frame === 'goomba'
      ? 'goomba'
      : frame === 'redKoopa'
      ? 'koopaR'
      : frame === 'greenKoopa'
      ? 'koopaG'
      : frame === 'greenParakoopa'
      ? 'bouncyKoop'
      : frame === 'redParakoopa'
      ? 'flyingKoopa'
      : frame === 'buzzy'
      ? 'buzzy'
      : 'goomba'
  }));
}