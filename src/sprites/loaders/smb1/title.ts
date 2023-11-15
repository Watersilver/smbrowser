import SpritesGroup from "../../../spriteUtils/sprites-group";
import SpriteWrapperFactory from "../spritewrapper-factory";
import smb1TitleSpritesheet from "./spritesheets.ts/title";

export type Smb1TitleSprites = SpritesGroup<{readonly [frame in typeof smb1TitleSpritesheet['frames'][number]]: any}>;

class Smb1TitleFactory extends SpriteWrapperFactory<typeof smb1TitleSpritesheet, Smb1TitleSprites> {
  protected override produce() {
    const titleSprites = SpritesGroup.from(
      smb1TitleSpritesheet,
      smb1TitleSpritesheet.getFrames(),
      'board'
    );
    const startFrame = titleSprites.getFrame();
    for (const frame of titleSprites.getFrames()) {
      titleSprites.setFrame(frame);
      const y = (titleSprites.container.height - 8) / titleSprites.container.height;
      titleSprites.setFrameAnchor(frame, {x: 0.5, y});
    }
    titleSprites.setFrame(startFrame);
    return titleSprites;
  }
}

const smb1titleFactory = new Smb1TitleFactory(smb1TitleSpritesheet);

export default smb1titleFactory;