import { Ecs, Vec2d } from "./engine"
import { Smb1MarioSprites } from "./sprites/loaders/smb1/mario";

export type Entity = {
  positionStart: Vec2d;
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
  };
  player?: boolean;
  marioInput?: {
    inputs: {
      jump?: boolean;
      jumping?: boolean;
      left?: boolean;
      right?: boolean;
      attack?: boolean;
      run?: number;
      ducking?: boolean;
    }
    anyPressed?: boolean;
  };
  marioMovementConfig?: {
    minWalkSpeed: number;
    maxWalkSpeed: number;
    maxWalkSpeedUnderwater: number;
    cutsceneWalkSpeed: number;
    walkAccel: number;
    maxRunSpeed: number;
    runAccel: number;
    releaseDecel: number;
    skidDecel: number;
    skidTurnaround: number;
    jumpBackwardsDecelThreshold: number;
    jumpFastAccel: number;
    jumpSlowAccel: number;
    jumpFastDecel: number;
    jumpNormalDecel: number;
    jumpSlowDecel: number;
    initFallGravity: number;
    initJumpGravity: number;
    walkGravitySpeed: number;
    walkJump: number;
    walkFallGravity: number;
    walkJumpGravity: number;
    midGravitySpeed: number;
    midJump: number;
    midFallGravity: number;
    midJumpGravity: number;
    runJump: number;
    runFallGravity: number;
    runJumpGravity: number;
    swimJump: number;
    swimFallGravity: number;
    swimJumpGravity: number;
    whirlpoolJump: number;
    whirlpoolFallGravity: number;
    whirlpoolJumpGravity: number;
    surfaceJump: number;
    surfaceFallGravity: number;
    surfaceJumpGravity: number;
  };
  mario?: {
    running?: boolean;
    skidding?: boolean;
    skidDecel?: boolean;
    facing: 1 | -1;
    jumped?: boolean;
    jumping?: boolean;
    jumpCooldown?: number;
    maxAirSpeed?: number;
    jumpSpeed?: number;
    jumpGravity?: number;
    fallGravity?: number;
    whirlpool?: boolean;
    surface?: boolean;
    big?: boolean;
    changedSize?: boolean;
    ducking?: boolean;
    forcedDucking?: boolean;
    grounded?: boolean;
    swimLoops?: number;
    prevGrounded?: boolean;
    shooting?: number;
    powerup?: "fire";

    // Use same mechanism for wind and whirlpools
    wind?: number;
  };
  gravity?: number;
  underwater?: boolean;
  dynamicIndex: number;
  kinematicIndex: number;
  staticIndex: number;
  static?: boolean;
  prevHits?: {e: Entity; normal: Vec2d; point: Vec2d;}[];
  hits?: {e: Entity; normal: Vec2d; point: Vec2d;}[];
  touchingUp?: Entity[];
  touchingRight?: Entity[];
  touchingDown?: Entity[];
  touchingLeft?: Entity[];
  floorSpeed?: number;
  floorSpeedY?: number;
  smb1MarioAnimations?: Smb1MarioSprites;
}

export function newEntity(init?: Partial<Entity>): Entity {
  const newEnt: Entity = {
    positionStart: new Vec2d(0, 0),
    positionPrev: new Vec2d(0, 0),
    position: new Vec2d(0, 0),
    size: new Vec2d(0, 0),
    dynamicIndex: -1,
    staticIndex: -1,
    kinematicIndex: -1,
  };
  Object.assign(newEnt, init);
  return newEnt;
}

const entities = new Ecs<Entity>();

export default entities;