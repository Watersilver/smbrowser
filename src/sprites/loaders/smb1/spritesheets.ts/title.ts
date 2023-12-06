import image from '../../../../assets/SMB_Title.png'
import SpritesheetWrapper from "../../../../spriteUtils/spritesheet-wrapper";

// gutter problems:
// https://www.html5gamedevs.com/topic/49927-textures-from-spritesheet-include-edges-of-other-sprites/
const titleSmb1Json = {
  frames: {
    board: {x:40,y:32,w:201,h:97}
  },

  transparency: [
    {r: {from: 0.57, to: 0.581}, g: {from: 0.55, to: 0.581}, b: {from: 0.99, to: 1}}
  ]
} as const;

const smb1TitleSpritesheet = new SpritesheetWrapper(image, titleSmb1Json);
export default smb1TitleSpritesheet;