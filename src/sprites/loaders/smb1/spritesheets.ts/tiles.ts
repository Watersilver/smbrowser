import image from '../../../../assets/smb1tileset.png'
import SpritesheetWrapper from "../../../../spriteUtils/spritesheet-wrapper";

// gutter problems:
// https://www.html5gamedevs.com/topic/49927-textures-from-spritesheet-include-edges-of-other-sprites/
const tilesSmb1Json = {
  frames: {
    solidFloor1: {x:0,y:16,w:16,h:16},
    solidBlock1: {x:0,y:33,w:16,h:16},
    solidFloor2: {x:147,y:16,w:16,h:16},
    solidBlock2: {x:147,y:33,w:16,h:16},
    solidCastleBlock: {x:0,y:151,w:16,h:16},
    solidUnderwaterBlock: {x:147,y:134,w:16,h:16},
    solidUnderwaterSeaweed: {x:215,y:297,w:16,h:16},
    solidBridge: {x:34,y:33,w:16,h:16},
    solidBulletBillBody: {x:119,y:33,w:16,h:16},
    solidBulletBillBase: {x:119,y:50,w:16,h:16},
    solidGreenShroomLeft: {x:0,y:196,w:16,h:16},
    solidGreenShroomMiddle: {x:17,y:196,w:16,h:16},
    solidGreenShroomRight: {x:34,y:196,w:16,h:16},
    solidGreenDotShroomLeft: {x:51,y:196,w:16,h:16},
    solidGreenDotShroomMiddle: {x:68,y:196,w:16,h:16},
    solidGreenDotShroomRight: {x:85,y:196,w:16,h:16},
    solidOrangeShroomLeft: {x:0,y:364,w:16,h:16},
    solidOrangeShroomMiddle: {x:17,y:364,w:16,h:16},
    solidOrangeShroomRight: {x:34,y:364,w:16,h:16},
    solidOrangeDotShroomLeft: {x:51,y:364,w:16,h:16},
    solidOrangeDotShroomMiddle: {x:68,y:364,w:16,h:16},
    solidOrangeDotShroomRight: {x:85,y:364,w:16,h:16},
    solidGreenPipeLeftHeadTop: {x:85,y:230,w:16,h:16},
    solidGreenPipeLeftHeadBottom: {x:85,y:247,w:16,h:16},
    solidGreenPipeLeftBodyTop: {x:102,y:230,w:16,h:16},
    solidGreenPipeLeftBodyBottom: {x:102,y:247,w:16,h:16},
    solidGreenPipeConnectionTop: {x:119,y:230,w:16,h:16},
    solidGreenPipeConnectionBottom: {x:119,y:247,w:16,h:16},
    solidGreenPipeTopHeadLeft: {x:119,y:196,w:16,h:16},
    solidGreenPipeTopHeadRight: {x:136,y:196,w:16,h:16},
    solidGreenPipeTopBodyLeft: {x:119,y:213,w:16,h:16},
    solidGreenPipeTopBodyRight: {x:136,y:213,w:16,h:16},
    solidWhitePipeLeftHeadTop: {x:85,y:230+84,w:16,h:16},
    solidWhitePipeLeftHeadBottom: {x:85,y:247+84,w:16,h:16},
    solidWhitePipeLeftBodyTop: {x:102,y:230+84,w:16,h:16},
    solidWhitePipeLeftBodyBottom: {x:102,y:247+84,w:16,h:16},
    solidWhitePipeConnectionTop: {x:119,y:230+84,w:16,h:16},
    solidWhitePipeConnectionBottom: {x:119,y:247+84,w:16,h:16},
    solidWhitePipeTopHeadLeft: {x:119,y:196+84,w:16,h:16},
    solidWhitePipeTopHeadRight: {x:136,y:196+84,w:16,h:16},
    solidWhitePipeTopBodyLeft: {x:119,y:213+84,w:16,h:16},
    solidWhitePipeTopBodyRight: {x:136,y:213+84,w:16,h:16},
    solidPurplePipeLeftHeadTop: {x:85+164,y:230+84,w:16,h:16},
    solidPurplePipeLeftHeadBottom: {x:85+164,y:247+84,w:16,h:16},
    solidPurplePipeLeftBodyTop: {x:102+164,y:230+84,w:16,h:16},
    solidPurplePipeLeftBodyBottom: {x:102+164,y:247+84,w:16,h:16},
    solidPurplePipeConnectionTop: {x:119+164,y:230+84,w:16,h:16},
    solidPurplePipeConnectionBottom: {x:119+164,y:247+84,w:16,h:16},
    solidPurplePipeTopHeadLeft: {x:119+164,y:196+84,w:16,h:16},
    solidPurplePipeTopHeadRight: {x:136+164,y:196+84,w:16,h:16},
    solidPurplePipeTopBodyLeft: {x:119+164,y:213+84,w:16,h:16},
    solidPurplePipeTopBodyRight: {x:136+164,y:213+84,w:16,h:16},
    solidOrangePipeLeftHeadTop: {x:85,y:230+84 * 2,w:16,h:16},
    solidOrangePipeLeftHeadBottom: {x:85,y:247+84 * 2,w:16,h:16},
    solidOrangePipeLeftBodyTop: {x:102,y:230+84 * 2,w:16,h:16},
    solidOrangePipeLeftBodyBottom: {x:102,y:247+84 * 2,w:16,h:16},
    solidOrangePipeConnectionTop: {x:119,y:230+84 * 2,w:16,h:16},
    solidOrangePipeConnectionBottom: {x:119,y:247+84 * 2,w:16,h:16},
    solidOrangePipeTopHeadLeft: {x:119,y:196+84 * 2,w:16,h:16},
    solidOrangePipeTopHeadRight: {x:136,y:196+84 * 2,w:16,h:16},
    solidOrangePipeTopBodyLeft: {x:119,y:213+84 * 2,w:16,h:16},
    solidOrangePipeTopBodyRight: {x:136,y:213+84 * 2,w:16,h:16},
    brick1: {x:17,y:16,w:16,h:16},
    brick2: {x:164,y:16,w:16,h:16},
    brick3: {x:17,y:100,w:16,h:16},
    brickBottom1: {x:34,y:16,w:16,h:16},
    brickBottom2: {x:181,y:16,w:16,h:16},
    brickBottom3: {x:34,y:100,w:16,h:16},
    blockHit1: {x:51,y:16,w:16,h:16},
    blockHit2: {x:198,y:16,w:16,h:16},
    blockHit3: {x:51,y:100,w:16,h:16},
    block1: {x:298,y:78,w:16,h:16},
    block2: {x:315,y:78,w:16,h:16},
    block3: {x:332,y:78,w:16,h:16},
    blockCoin: {x:349,y:78,w:16,h:16},
    blockCoins: {x:349,y:95,w:16,h:16},
    blockPowerup: {x:349,y:112,w:16,h:16},
    blockStar: {x:349,y:129,w:16,h:16},
    blockLife: {x:349,y:146,w:16,h:16},
    blockInvisibleCoin: {x:366,y:78,w:16,h:16},
    blockInvisibleCoins: {x:366,y:95,w:16,h:16},
    blockInvisiblePowerup: {x:366,y:112,w:16,h:16},
    blockInvisibleStar: {x:366,y:129,w:16,h:16},
    blockInvisibleLife: {x:366,y:146,w:16,h:16},
    blockBrick1Coin: {x:383,y:78,w:16,h:16},
    blockBrick1Coins: {x:383,y:95,w:16,h:16},
    blockBrick1Powerup: {x:383,y:112,w:16,h:16},
    blockBrick1Star: {x:383,y:129,w:16,h:16},
    blockBrick1Life: {x:383,y:146,w:16,h:16},
    blockBrick1BottomCoin: {x:400,y:78,w:16,h:16},
    blockBrick1BottomCoins: {x:400,y:95,w:16,h:16},
    blockBrick1BottomPowerup: {x:400,y:112,w:16,h:16},
    blockBrick1BottomStar: {x:400,y:129,w:16,h:16},
    blockBrick1BottomLife: {x:400,y:146,w:16,h:16},
    blockBrick2Coin: {x:417,y:78,w:16,h:16},
    blockBrick2Coins: {x:417,y:95,w:16,h:16},
    blockBrick2Powerup: {x:417,y:112,w:16,h:16},
    blockBrick2Star: {x:417,y:129,w:16,h:16},
    blockBrick2Life: {x:417,y:146,w:16,h:16},
    blockBrick2BottomCoin: {x:434,y:78,w:16,h:16},
    blockBrick2BottomCoins: {x:434,y:95,w:16,h:16},
    blockBrick2BottomPowerup: {x:434,y:112,w:16,h:16},
    blockBrick2BottomStar: {x:434,y:129,w:16,h:16},
    blockBrick2BottomLife: {x:434,y:146,w:16,h:16},
    blockBrick3Coin: {x:451,y:78,w:16,h:16},
    blockBrick3Coins: {x:451,y:95,w:16,h:16},
    blockBrick3Powerup: {x:451,y:112,w:16,h:16},
    blockBrick3Star: {x:451,y:129,w:16,h:16},
    blockBrick3Life: {x:451,y:146,w:16,h:16},
    blockBrick3BottomCoin: {x:468,y:78,w:16,h:16},
    blockBrick3BottomCoins: {x:468,y:95,w:16,h:16},
    blockBrick3BottomPowerup: {x:468,y:112,w:16,h:16},
    blockBrick3BottomStar: {x:468,y:129,w:16,h:16},
    blockBrick3BottomLife: {x:468,y:146,w:16,h:16},
    coin1: {x:298,y:95,w:16,h:16},
    coin2: {x:315,y:95,w:16,h:16},
    coin3: {x:332,y:95,w:16,h:16},
    clutterGreenPipeBodyVerticalLeft: {x:346,y:214,w:16,h:16},
    clutterGreenPipeBodyVerticalRight: {x:363,y:214,w:16,h:16},
    clutterGreenPipeBodyHorizontalTop: {x:380,y:231,w:16,h:16},
    clutterGreenPipeBodyHorizontalBotton: {x:380,y:248,w:16,h:16},
    clutterGreenPipeConntectorTL: {x:346,y:231,w:16,h:16},
    clutterGreenPipeConntectorTR: {x:363,y:231,w:16,h:16},
    clutterGreenPipeConntectorBL: {x:346,y:248,w:16,h:16},
    clutterGreenPipeConntectorBR: {x:363,y:248,w:16,h:16},
  },

  animations: {
    block: ['block1', 'block2', 'block3'],
    coin: ['coin1', 'coin2', 'coin3']
  },

  transparency: [
    {r: {from: 0.579, to: 0.581}, g: {from: 0.579, to: 0.581}, b: {from: 0.99, to: 1}},
    {r: {from: 0, to: 0.01}, g: {from: 0.16, to: 0.17}, b: {from: 0.54, to: 0.55}}
  ]
} as const;

const smb1TilesSpritesheet = new SpritesheetWrapper(image, tilesSmb1Json);
export default smb1TilesSpritesheet;