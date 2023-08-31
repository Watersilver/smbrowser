import { Entity } from "./entities";
import { Smb1TilesSprites } from "./sprites/loaders/smb1/tiles";

export type KeyOfMap<M extends Map<unknown, unknown>> = M extends Map<infer K, unknown> ? K : never;

export enum EntityTypeMapping {
  mario = "m",
  block = "b",
  brick = "r",
  coinblock = "q",
  coin = "c",
  kinematic = "k",
  clutter = 'd'
}

export type Zone = {x: number; y: number; w: number; h: number;};

export type Points = [x: number, y: number][];

export type LevelData = {
  entities: [
    type: EntityTypeMapping,
    x: number,
    y: number,
    init?: {
      tileFrame?: Smb1TilesSprites['frame'];
    },
    custom?: Entity
  ][];
  entities2: [
    type: EntityTypeMapping,
    x: number,
    y: number,
    init?: {
      tileFrame?: Smb1TilesSprites['frame'];
    },
    custom?: Entity
  ][];
  camZones?: Zone[];
  camPreserveZones?: Zone[];
  deathZones?: Zone[];
  underwaterZones?: Zone[];
  whirlpoolZones?: Zone[];
  surfaceZones?: Zone[];
  noMarioInputZones?: Zone[];
  pipes?: Points[];
};