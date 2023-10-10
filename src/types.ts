import { Vec2dData } from "./engine/Vec2d";
import { Entity } from "./entities";
import { Smb1EnemiesAnimations } from "./sprites/loaders/smb1/enemies";
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
  platform = 'p',
  enemy = 'e',
  npc = 'n'
}

export type Zone = {x: number; y: number; w: number; h: number;};

export type Points = [x: number, y: number][];

export type Vine = {x: number, y: number, h: number;};

export type LineSeg = {p1: Vec2dData; p2: Vec2dData;};

export type PlatformConnection = {pin: Vec2dData; w: number; h1: number; h2: number; setting?: 'w' | 'h1' | 'h2'};

export type OscillationInit = {p1: Vec2dData; p2: Vec2dData; pstart: Vec2dData; setting?: 'p1' | 'p2'};

export type LevelData = {
  entities: [
    type: EntityTypeMapping,
    x: number,
    y: number,
    init?: {
      tileFrame?: Smb1TilesSprites['frame'];
      objectFrame?: Smb1ObjectsSprites['frame'];
      enemyAnim?: Smb1EnemiesAnimations['animation'];
      text?: string;
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
      enemyAnim?: Smb1EnemiesAnimations['animation'];
      text?: string;
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
  descendingPlatformZones?: Zone[];
  pipes?: Points[];
  vines?: Vine[];
  trampolines?: Vine[];
  oscillations?: OscillationInit[];
  platformRoutes?: LineSeg[];
  platformConnections?: PlatformConnection[];
};