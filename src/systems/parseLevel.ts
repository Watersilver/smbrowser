import { Vec2d } from "../engine";
import entities, { Entity, newEntity } from "../entities";
import newCoinblock from "../entityFactories/newCoinblock";
import newBlock from "../entityFactories/newBlock";
import newClutter from "../entityFactories/newClutter";
import newMario from "../entityFactories/newMario";
import { EntityTypeMapping, LevelData } from "../types";
import newBrick from "../entityFactories/newBrick";
import newCoin from "../entityFactories/newCoin";
import newPlatform from "../entityFactories/newPlatform";

export default function parseLevel(levelData: string | LevelData) {
  // No type checking. GOOD LUCK!!
  const parsed = typeof levelData === "string" ? JSON.parse(levelData) as LevelData : levelData;

  const grid: {[position: string]: {
    gameObj: Entity;
    init: LevelData['entities'][number];
  }} = {};
  const grid2: {[position: string]: {
    gameObj: Entity;
    init: LevelData['entities'][number];
  }} = {};

  for (const layer of [1, 2]) {
    const g = layer === 1 ? grid : grid2;
    const e = layer === 1 ? parsed.entities : parsed.entities2;
    for (const entInit of e) {
      let ent: Entity | null = null;
      switch (entInit[0]) {
        case EntityTypeMapping.mario: {
          ent = newMario(entInit[1], entInit[2]);
          break;
        }
        case EntityTypeMapping.block: {
          const frame = entInit[3]?.tileFrame;
          ent = newBlock(entInit[1], entInit[2], frame);
          if (layer === 2) {
            if (ent.smb1TilesSprites) ent.smb1TilesSprites.container.zIndex = -5;
          }
          break;
        }
        case EntityTypeMapping.brick: {
          const frame = entInit[3]?.tileFrame;
          ent = newBrick(entInit[1], entInit[2], frame);
          break;
        }
        case EntityTypeMapping.coin: {
          ent = newCoin(entInit[1], entInit[2]);
          break;
        }
        case EntityTypeMapping.clutter: {
          const frame = entInit[3]?.tileFrame;
          ent = newClutter(entInit[1], entInit[2], {type: "tile", frame});
          if (layer === 2) {
            if (ent.smb1TilesSprites) ent.smb1TilesSprites.container.zIndex = -5;
          }
          break;
        }
        case EntityTypeMapping.coinblock: {
          const frame = entInit[3]?.tileFrame;
          ent = newCoinblock(entInit[1], entInit[2], frame);
          break;
        }
        case EntityTypeMapping.platform: {
          const frame = entInit[3]?.objectFrame;
          ent = newPlatform(entInit[1], entInit[2], frame);
          break;
        }
      }

      if (ent) {
        const key = (Math.floor(ent.position.x / 16) * 16) + "." + (Math.floor(ent.position.y / 16) * 16);
        const other = g[key];

        // Remove overlapping
        if (other) {
          entities.remove(other.gameObj);
          const i = parsed.entities.indexOf(other.init);
          if (i !== -1) {
            const last = parsed.entities.at(-1);
            if (last) parsed.entities[i] = last;
            parsed.entities.pop();
          }
        }

        // Add new
        g[key] = {
          gameObj: ent,
          init: entInit
        }
      }
    }
  }

  return {parsed, grid, grid2};
}