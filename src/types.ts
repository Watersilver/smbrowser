import { Entity } from "./entities";

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
    init?: {},
    custom?: Entity
  ][];
};