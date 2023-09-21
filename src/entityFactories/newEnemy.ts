import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1EnemiesAnimations } from "../sprites/loaders/smb1/enemies";
import smb1Sprites from "../sprites/smb1";

export default function newEnemy(x: number, y: number, frame?: Smb1EnemiesAnimations['animation']) {
  const smb1EnemiesAnimations = smb1Sprites.getFactory('enemies').new();
  smb1EnemiesAnimations.setAnimation(frame || 'goomba');

  let width = 14;
  let height = 14;

  const plant = frame === 'greenPiranhaPlant';
  const blooper = frame === 'blooper';

  if (plant) {
    width = 10;
    height = 24;
  }

  y = y + 8 - height * 0.5;
  smb1EnemiesAnimations.container.zIndex = 2;
  smb1EnemiesAnimations.loopsPerSecond = 4;

  if (plant) {
    height = 10;
    smb1EnemiesAnimations.loopsPerSecond = 2;
    smb1EnemiesAnimations.container.zIndex = -2;
  }

  if (blooper) {
    smb1EnemiesAnimations.loopsPerSecond = 0;
  }
  
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(width, height),
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
      : blooper
      ? 'blooper'
      : plant
      ? 'plant'
      : 'goomba',
    ...(
      plant ? {
        displace: {
          x: 8,
          y: 24
        }
      } : null
    )
  }));
}