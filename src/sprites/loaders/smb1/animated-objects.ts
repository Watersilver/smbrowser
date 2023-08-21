import AnimationsGroup from "../../../spriteUtils/animations-group";
import SpriteWrapperFactory from "../spritewrapper-factory";
import smb1ObjectsSpritesheet from "./spritesheets.ts/objects";

export type Smb1ObjectsAnimations = AnimationsGroup<{readonly [animation in typeof smb1ObjectsSpritesheet['animations'][number]]: any}>;

class Smb1ObjectsAnimationsFactory extends SpriteWrapperFactory<typeof smb1ObjectsSpritesheet, Smb1ObjectsAnimations> {
  protected override produce() {
    const objectsAnims = AnimationsGroup.from(
      smb1ObjectsSpritesheet,
      smb1ObjectsSpritesheet.getAnimations(),
      'coin'
    );
    return objectsAnims;
  }
}

const smb1objectsanimationsFactory = new Smb1ObjectsAnimationsFactory(smb1ObjectsSpritesheet);

export default smb1objectsanimationsFactory;