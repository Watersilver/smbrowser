import AnimationsGroup from "../../../spriteUtils/animations-group";
import SpriteWrapperFactory from "../spritewrapper-factory";
import smb1TilesSpritesheet from "./spritesheets.ts/tiles";

export type Smb1TilesAnimations = AnimationsGroup<{readonly [animation in typeof smb1TilesSpritesheet['animations'][number]]: any}>;

class Smb1TilesAnimationsFactory extends SpriteWrapperFactory<typeof smb1TilesSpritesheet, Smb1TilesAnimations> {
  protected override produce() {
    const tilesAnims = AnimationsGroup.from(
      smb1TilesSpritesheet,
      smb1TilesSpritesheet.getAnimations(),
      'coin'
    );
    return tilesAnims;
  }
}

const smb1tilesanimationsFactory = new Smb1TilesAnimationsFactory(smb1TilesSpritesheet);

export default smb1tilesanimationsFactory;