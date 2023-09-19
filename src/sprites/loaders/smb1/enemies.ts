import AnimationsGroup from "../../../spriteUtils/animations-group";
import SpriteWrapperFactory from "../spritewrapper-factory";
import smb1EnemiesSpritesheet from "./spritesheets.ts/enemies";

export type Smb1EnemiesAnimations = AnimationsGroup<{readonly [animation in typeof smb1EnemiesSpritesheet['animations'][number]]: any}>;

class Smb1EnemiesAnimationsFactory extends SpriteWrapperFactory<typeof smb1EnemiesSpritesheet, Smb1EnemiesAnimations> {
  protected override produce() {
    const e = AnimationsGroup.from(
      smb1EnemiesSpritesheet,
      smb1EnemiesSpritesheet.getAnimations(),
      'goomba'
    );
    e.setAnimationAnchor('goombaDead', {x: 0.5, y: 0});
    e.setAnimationAnchor('greenKoopashell', {x: 0.5, y: 0.46});
    e.setAnimationAnchor('redKoopashell', {x: 0.5, y: 0.46});
    let y = 0.67;
    e.setAnimationAnchor('greenKoopa', {x: 0.5, y});
    e.setAnimationAnchor('redKoopa', {x: 0.5, y});
    e.setAnimationAnchor('greenParakoopa', {x: 0.5, y});
    e.setAnimationAnchor('redParakoopa', {x: 0.5, y});
    return e;
  }
}

const smb1enemiesanimationsFactory = new Smb1EnemiesAnimationsFactory(smb1EnemiesSpritesheet);

export default smb1enemiesanimationsFactory;