import SpritesGroup from "../../../spriteUtils/sprites-group";
import SpriteWrapperFactory from "../spritewrapper-factory";
import smb1ObjectsSpritesheet from "./spritesheets.ts/objects";

export type Smb1ObjectsSprites = SpritesGroup<{readonly [frame in typeof smb1ObjectsSpritesheet['frames'][number]]: any}>;

class Smb1ObjectsFactory extends SpriteWrapperFactory<typeof smb1ObjectsSpritesheet, Smb1ObjectsSprites> {
  protected override produce() {
    const objectsSprites = SpritesGroup.from(
      smb1ObjectsSpritesheet,
      smb1ObjectsSpritesheet.getFrames(),
      'mushroom'
    );
    return objectsSprites;
  }
}

const smb1objectsFactory = new Smb1ObjectsFactory(smb1ObjectsSpritesheet);

export default smb1objectsFactory;