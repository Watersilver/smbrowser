import { Vec2d } from "../engine";
import entities, { Entity, newEntity } from "../entities";
import newBlock from "../entityFactories/newBlock";
import newMario from "../entityFactories/newMario";
import { EntityTypeMapping, LevelData } from "../types";

export default function parseLevel(levelData: string | LevelData) {
  // GOOD LUCK!!
  const parsed = typeof levelData === "string" ? JSON.parse(levelData) as LevelData : levelData;

  const grid: {[position: string]: {
    gameObj: Entity;
    init: LevelData['entities'][number];
  }} = {};

  const entitiesInit = parsed.entities;
  for (const entInit of entitiesInit) {
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
      const other = grid[key];

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
      grid[key] = {
        gameObj: ent,
        init: entInit
      }
    }
  }

  return {parsed, grid};
}