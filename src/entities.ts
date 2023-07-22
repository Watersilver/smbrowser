import { Ecs, Vec2d } from "./engine"

export type Entity = {
  positionPrev: Vec2d;
  position: Vec2d;
  size: Vec2d;
  dynamic?: {
    velocity: Vec2d;
    acceleration: Vec2d;
    grounded: boolean;
  };
  kinematic?: {
    velocity: Vec2d;
    acceleration: Vec2d;
  },
  dynamicVelocityComponents?: {
    [id: string]: Vec2d;
  },
  player?: boolean;
  marioInput?: {
    jump?: boolean;
    jumping?: boolean;
    left?: boolean;
    right?: boolean;
    attack?: boolean;
    run?: boolean;
  },
  marioMovementConfig?: {
    minWalkSpeed: number,
    maxWalkSpeed: number,
    maxWalkSpeedUnderwater: number,
    cutsceneWalkSpeed: number,
    walkAccel: number,
    maxRunSpeed: number,
    runAccel: number,
    releaseDeccel: number,
    skidDeccel: number,
    skidTurnaround: number
  };
  dynamicIndex: number;
  kinematicIndex: number;
  staticIndex: number;
  static?: boolean;
  hits?: {e: Entity; normal: Vec2d; point: Vec2d;}[];
  touchingUp?: Entity[];
  touchingRight?: Entity[];
  touchingDown?: Entity[];
  touchingLeft?: Entity[];
}

export function newEntity(init?: Partial<Entity>): Entity {
  const newEnt: Entity = {
    positionPrev: new Vec2d(0, 0),
    position: new Vec2d(0, 0),
    size: new Vec2d(0, 0),
    dynamicIndex: -1,
    staticIndex: -1,
    kinematicIndex: -1
  };
  Object.assign(newEnt, init);
  return newEnt;
}

const entities = new Ecs<Entity>();

export default entities;