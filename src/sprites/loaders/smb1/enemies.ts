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
    return e;
  }
}

const smb1enemiesanimationsFactory = new Smb1EnemiesAnimationsFactory(smb1EnemiesSpritesheet);

export default smb1enemiesanimationsFactory;