import { Vec2dData } from "./engine/Vec2d";
import { Entity } from "./entities";
import { Smb1ObjectsSprites } from "./sprites/loaders/smb1/objects";
import { Smb1TilesSprites } from "./sprites/loaders/smb1/tiles";

export type KeyOfMap<M extends Map<unknown, unknown>> = M extends Map<infer K, unknown> ? K : never;

export enum EntityTypeMapping {
  mario = "m",
  block = "b",
  brick = "r",
  coinblock = "q",
  coin = "c",
  kinematic = "k",
  clutter = 'd',
  platform = 'p'
}

export type Zone = {x: number; y: number; w: number; h: number;};

export type Points = [x: number, y: number][];

export type Vine = {x: number, y: number, h: number;};

export type LineSeg = {p1: Vec2dData; p2: Vec2dData;};

export type PlatformConnection = {p1: Vec2dData; p2: Vec2dData; h1: number; h2: number;};

export type OscillationInit = {p1: Vec2dData; p2: Vec2dData; pstart: Vec2dData; setting?: 'p1' | 'p2'};

export type LevelData = {
  entities: [
    type: EntityTypeMapping,
    x: number,
    y: number,
    init?: {
      tileFrame?: Smb1TilesSprites['frame'];
      objectFrame?: Smb1ObjectsSprites['frame'];
    },
    custom?: Entity
  ][];
  entities2: [
    type: EntityTypeMapping,
    x: number,
    y: number,
    init?: {
      tileFrame?: Smb1TilesSprites['frame'];
      objectFrame?: Smb1ObjectsSprites['frame'];
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
  vines?: Vine[];
  trampolines?: Vine[];
};