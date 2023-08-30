import { Vec2d } from "../engine";
import entities, { Entity, newEntity } from "../entities";
import newCoinblock from "../entityFactories/newCoinblock";
import newBlock from "../entityFactories/newBlock";
import newClutter from "../entityFactories/newClutter";
import newMario from "../entityFactories/newMario";
import { EntityTypeMapping, LevelData } from "../types";
import newBrick from "../entityFactories/newBrick";

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
          break;
        }
        case EntityTypeMapping.brick: {
          const frame = entInit[3]?.tileFrame;
          ent = newBrick(entInit[1], entInit[2], frame);
          break;
        }
        case EntityTypeMapping.coin: {
          const frame = entInit[3]?.tileFrame;
          ent = newBlock(entInit[1], entInit[2], frame);
          break;
        }
        case EntityTypeMapping.clutter: {
          const frame = entInit[3]?.tileFrame;
          ent = newClutter(entInit[1], entInit[2], frame);
          break;
        }
        case EntityTypeMapping.coinblock: {
          const frame = entInit[3]?.tileFrame;
          ent = newCoinblock(entInit[1], entInit[2], frame);
          break;
        }
        case EntityTypeMapping.kinematic: {
          ent = entities.createEntity(newEntity({
            position: new Vec2d(144, 22),
            size: new Vec2d(22, 6),
            kinematic: {
              velocity: new Vec2d(0, 0),
              acceleration: new Vec2d(0, 0)
            }
          }));
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