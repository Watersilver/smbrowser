import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1TilesSprites } from "../sprites/loaders/smb1/tiles";
import smb1Sprites from "../sprites/smb1";

export default function newCoinblock(x: number, y: number, editFrame?: Smb1TilesSprites['frame']) {
  const smb1TilesSprites = smb1Sprites.getFactory('tiles').new();

  const coinblock =
    editFrame?.includes('Coins')
    ? 'coins'
    : editFrame?.includes('Pow')
    ? 'pow'
    : editFrame?.includes('Star')
    ? 'star'
    : editFrame?.includes('Life')
    ? 'life'
    : 'coin';

  switch (editFrame) {
    case 'blockCoin':
    case 'blockCoins':
    case 'blockPowerup':
    case 'blockStar':
    case 'blockLife':
      const smb1TilesAnimations = smb1Sprites.getFactory('animTiles').new();
      smb1TilesAnimations.setAnimation('block');
      smb1TilesSprites.setFrame(editFrame ?? 'solidFloor1');
      return entities.createEntity(newEntity({
        position: new Vec2d(x, y), size: new Vec2d(16, 16), static: true,
        smb1TilesAnimations,
        coinblock,
        smb1TilesSpritesEditMode: smb1TilesSprites
      }));
    default:
      const smb1TilesSpritesEditMode = smb1Sprites.getFactory('tiles').new();
      smb1TilesSpritesEditMode.setFrame(editFrame ?? 'solidFloor1');
      if (editFrame?.includes("Brick")) {
        if (editFrame?.includes("Bottom")) {
          if (editFrame.includes("2")) {
            smb1TilesSprites.setFrame('brickBottom2');
          } else if (editFrame.includes("3")) {
            smb1TilesSprites.setFrame('brickBottom3');
          } else {
            smb1TilesSprites.setFrame('brickBottom1');
          }
        } else {
          if (editFrame.includes("2")) {
            smb1TilesSprites.setFrame('brick2');
          } else if (editFrame.includes("3")) {
            smb1TilesSprites.setFrame('brick3');
          } else {
            smb1TilesSprites.setFrame('brick1');
          }
        }
      } else if (editFrame?.includes('Invisible')) {
        smb1TilesSprites.setFrame(editFrame);
      }
      return entities.createEntity(newEntity({
        position: new Vec2d(x, y), size: new Vec2d(16, 16), static: true,
        smb1TilesSprites,
        coinblock,
        invisibleBlock: editFrame?.includes('Invisible'),
        smb1TilesSpritesEditMode
      }));
  }
}