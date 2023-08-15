import SpritesheetWrapper from "../../../spriteUtils/spritesheet-wrapper"
import image from '../../../assets/NES - Super Mario Bros - Mario & Luigi.png'
import { LazyLoader } from "../../../spriteUtils/lazy-loader";
import SpritesGroup from "../../../spriteUtils/sprites-group";

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

const newTilesLoader = () => new LazyLoader(() => {
  const tilesSprites = SpritesGroup.from(
    tSS,
    tSS.getFrames(),
    'block'
  );
  // tilesSprites.setFrameAnchor('bigJump', {x: 0.5, y: 0.57});
  // tilesSprites.setFrameAnchor('bigShootJump', {x: 0.5, y: 0.57});
  // tilesSprites.setFrameAnchor('bigDuck', {x: 0.5, y: 0.62});
  return tilesSprites;
});

export default newTilesLoader;