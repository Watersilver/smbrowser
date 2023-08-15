import SpritesheetWrapper from "../../../spriteUtils/spritesheet-wrapper"
import image from '../../../assets/smb1tileset.png'
import SpritesGroup from "../../../spriteUtils/sprites-group";
import SpriteWrapperFactory from "../spritewrapper-factory";

const tilesSmb1Json = {
  frames: {
    block: {x:0,y:16,w:16,h:16}
  },

  transparency: [
    {r: {from: 0.57, to: 0.58}, g: {from: 0.56, to: 0.57}, b: {from: 0.99, to: 1}},
    {r: {from: 0, to: 0.01}, g: {from: 0.16, to: 0.17}, b: {from: 0.54, to: 0.55}}
  ]
} as const;

const tSS = new SpritesheetWrapper(image, tilesSmb1Json);

export type Smb1TilesSprites = SpritesGroup<{readonly [frame in typeof tSS['frames'][number]]: any}>;

class Smb1TilesFactory extends SpriteWrapperFactory<typeof tSS, Smb1TilesSprites> {
  protected override produce() {
    const tileSprites = SpritesGroup.from(
      tSS,
      tSS.getFrames(),
      'block'
    );
    // tilesSprites.setFrameAnchor('bigJump', {x: 0.5, y: 0.57});
    // tilesSprites.setFrameAnchor('bigShootJump', {x: 0.5, y: 0.57});
    // tilesSprites.setFrameAnchor('bigDuck', {x: 0.5, y: 0.62});
    return tileSprites;
  }
}

const smb1tilesFactory = new Smb1TilesFactory(tSS);

export default smb1tilesFactory;