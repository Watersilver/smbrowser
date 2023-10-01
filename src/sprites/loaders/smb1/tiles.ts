import SpritesGroup from "../../../spriteUtils/sprites-group";
import SpriteWrapperFactory from "../spritewrapper-factory";
import smb1TilesSpritesheet from "./spritesheets.ts/tiles";

export type Smb1TilesSprites = SpritesGroup<{readonly [frame in typeof smb1TilesSpritesheet['frames'][number]]: any}>;

class Smb1TilesFactory extends SpriteWrapperFactory<typeof smb1TilesSpritesheet, Smb1TilesSprites> {
  protected override produce() {
    const tileSprites = SpritesGroup.from(
      smb1TilesSpritesheet,
      smb1TilesSpritesheet.getFrames(),
      'solidFloor1'
    );
    const startFrame = tileSprites.getFrame();
    for (const frame of tileSprites.getFrames()) {
      tileSprites.setFrame(frame);
      const y = (tileSprites.container.height - 8) / tileSprites.container.height;
      tileSprites.setFrameAnchor(frame, {x: 0.5, y});
    }
    tileSprites.setFrame(startFrame);
    return tileSprites;
  }
}

const smb1tilesFactory = new Smb1TilesFactory(smb1TilesSpritesheet);

export default smb1tilesFactory;