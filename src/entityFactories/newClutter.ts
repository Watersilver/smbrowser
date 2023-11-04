import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1ObjectsSprites } from "../sprites/loaders/smb1/objects";
import { Smb1TilesSprites } from "../sprites/loaders/smb1/tiles";
import smb1Sprites from "../sprites/smb1";

export default function newClutter(x: number, y: number, config: {
  type: "tile";
  frame?: Smb1TilesSprites['frame'];
} | {
  type: "object";
  frame?: Smb1ObjectsSprites['frame'];
}) {
  if (config.type === 'tile') {
    const smb1TilesSprites = smb1Sprites.getFactory('tiles').new();
    smb1TilesSprites.setFrame(config.frame ?? 'clutterFence');
    if (config.frame?.includes('Pipe')) {
      smb1TilesSprites.container.zIndex = 2;
    } else {
      smb1TilesSprites.container.zIndex = -5;
    }

    const e = entities.createEntity(newEntity({
      position: new Vec2d(x, y), size: new Vec2d(16, 16),
      smb1TilesSprites,
      grid: true
    }));

    if (config.frame) {
      if (config.frame.includes('Lava') || config.frame.includes('Water')) {
        smb1TilesSprites.container.zIndex = -4;
      } else if (config.frame === 'clutterFence') {
        smb1TilesSprites.container.zIndex = -25;
        e.distanceModifiers = {
          x: 0.05,
          y: 0
        };
      } else if (config.frame.includes('Hill')) {
        smb1TilesSprites.container.zIndex = -500;
        e.distanceModifiers = {
          x: 0.3,
          y: 0
        };
      } else if (config.frame.includes('Bush')) {
        smb1TilesSprites.container.zIndex = -50;
        e.distanceModifiers = {
          x: 0.1,
          y: 0
        };
      } else if (config.frame.includes('BgCloud')) {
        smb1TilesSprites.container.zIndex = -1000;
        e.distanceModifiers = {
          x: 0.4,
          y: 0
        };
      } else if (config.frame.includes('Tree') && config.frame !== 'clutterBigTreebark' && config.frame !== 'clutterBigTreebarkWhite') {
        smb1TilesSprites.container.zIndex = -100;
        e.distanceModifiers = {
          x: 0.2,
          y: 0
        };
      } else if (config.frame.includes('Castle') && config.frame !== 'clutterCastleBridgeChain') {
        smb1TilesSprites.container.zIndex = -200;
        e.distanceModifiers = {
          x: 0.25,
          y: 0
        };
      } else if (config.frame === 'clutterFlagpoleWhole') {
        e.size.x = 2;
        e.size.y = smb1TilesSprites.container.height;
        e.flagpole = {};
      } else if (config.frame === 'clutterAxe1') {
        e.static = true;
        e.hits = [];
        e.axe = true;
        delete e.smb1TilesSprites;
        const smb1TilesAnimations = smb1Sprites.getFactory('animTiles').new();
        smb1TilesAnimations.setAnimation('axe');
        e.smb1TilesAnimations = smb1TilesAnimations;
      }
    }

    return e;
  } else {
    const smb1ObjectsSprites = smb1Sprites.getFactory('objects').new();
    smb1ObjectsSprites.setFrame(config.frame ?? 'vine');
    smb1ObjectsSprites.container.zIndex = -5;
    return entities.createEntity(newEntity({
      position: new Vec2d(x, y), size: new Vec2d(16, 16),
      smb1ObjectsSprites
    }));
  }
}