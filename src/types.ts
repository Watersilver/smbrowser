import { Entity } from "./entities";
import { Smb1TilesSprites } from "./sprites/loaders/smb1/tiles";

export type KeyOfMap<M extends Map<unknown, unknown>> = M extends Map<infer K, unknown> ? K : never;

export enum EntityTypeMapping {
  mario = "m",
  block = "b",
  kinematic = "k"
}

export type LevelData = {
  entities: [
    type: EntityTypeMapping,
    x: number,
    y: number,
    init?: {
      tileFrame?: Smb1TilesSprites['frame']
    },
    custom?: Entity
  ][];
};