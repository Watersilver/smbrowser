import { Filter, Text } from "pixi.js";
import { Ecs, Vec2d } from "./engine"
import { Smb1ObjectsAnimations } from "./sprites/loaders/smb1/animated-objects";
import { Smb1TilesAnimations } from "./sprites/loaders/smb1/animated-tiles";
import { Smb1MarioSprites } from "./sprites/loaders/smb1/mario";
import { Smb1ObjectsSprites } from "./sprites/loaders/smb1/objects";
import { Smb1TilesSprites } from "./sprites/loaders/smb1/tiles";
import { Points, Vine } from "./types";
import { Smb1EnemiesAnimations } from "./sprites/loaders/smb1/enemies";

export type Entity = {
  positionStart: Vec2d;
  positionPrev: Vec2d;
  position: Vec2d;
  size: Vec2d;
  dynamic?: {
    velocity: Vec2d;
    acceleration: Vec2d;
  };
  kinematic?: {
    velocity: Vec2d;
    acceleration: Vec2d;
  };
  player?: {
    coins: number;
    lives: number;
    kicks8k: number;
    gainedPow?: boolean;
    gainedOneUp?: boolean;
  };
  marioInput?: {
    inputs: {
      jump?: boolean;
      jumping?: boolean;
      left?: boolean;
      right?: boolean;
      leftPress?: boolean;
      rightPress?: boolean;
      attack?: boolean;
      run?: number;
      ducking?: boolean;
      climbUp?: boolean;
      climbDown?: boolean;
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
    dead?: boolean;
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
    shot?: boolean;
    powerup?: "fire";
    star?: number;
    invinsibility?: number;
    climbing?: Entity;
    climbingCooldown?: number;
    respawnPoint?: {x: number; y: number;};

    // Use same mechanism for wind and whirlpools
    wind?: number;

    inPipe?: {
      path: Points;
      from: "u" | "d" | "l" | "r";
      to: "u" | "d" | "l" | "r";
      started?: boolean;
      exiting?: {x: number, y: number};
      iTarget?: number;
      zIndex?: number;
      nonIdle?: boolean;
    };

    onSpring?: {
      spring: Entity;
      vx: number;
    }
  };
  fireball?: {
    parent?: Entity;
    startVelocity: number;
  };
  fireballHit?: boolean;
  fireballHitEnemy?: boolean;
  filters?: Filter[];
  gravity?: number;
  underwater?: boolean;
  dynamicIndex: number;
  kinematicIndex: number;
  staticIndex: number;
  sensorIndex: number;
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
  smb1TilesSprites?: Smb1TilesSprites;
  smb1ObjectsSprites?: Smb1ObjectsSprites;
  smb1TilesAnimations?: Smb1TilesAnimations;
  smb1ObjectsAnimations?: Smb1ObjectsAnimations;
  smb1EnemiesAnimations?: Smb1EnemiesAnimations;
  smb1TilesSpritesEditMode?: Smb1TilesSprites;
  invisibleBlock?: boolean;
  brick?: boolean;
  coinblock?: 'coin' | 'coins' | 'pow' | 'life' | 'star' | 'vine';
  vineCreator?: Vine;
  vine?: {
    targetHeight: number;
    root: Entity;
    parts: Entity[];
  };
  vineStart?: boolean;
  coinblockDeathTimer?: number;
  hitAnim?: number;
  bonk?: boolean;
  smash?: boolean;
  bonkCooldown?: number;
  smashCooldown?: number;
  brokenBrick?: {
    side: 1 | -1;
    velocity: Vec2d;
  };
  grow?: number;
  movement?: {
    dontFallOff?: boolean;
    horizontal?: number;
    horizontalNow?: boolean;
    bounce?: number | true;
    bounceNow?: boolean;
    bounceOnce?: boolean;
    flipEachOther?: boolean;
    bounceStopHorizontal?: boolean;
    ignoreSoftHits?: boolean;
  };
  enemActivateOnVisible?:
    | 'blooper'
    | 'goomba'
    | 'buzzy'
    | 'koopaG'
    | 'koopaR'
    | 'bouncyKoop'
    | 'flyingKoopa'
    | 'plant'
    | 'hammerbro'
    | 'bowser'
    | 'bruce';
  enemStompRecovery?: number;
  enemy?: {
    stomp: boolean;
    fireball: boolean | number;
    star: boolean;
    shell: boolean;
    isStillShell?: boolean;
    isMovingShell?: boolean;
    lookTowards?: "direction" | "mario";
    harmless?: number;
    shellTimer?: number;
  };
  piranhaPlant?: {
    height: number,
    outTime?: number,
    inTime?: number,
    emerging?: boolean
  };
  blooper?: {
    moving?: {
      direction: 'left' | 'right';
      progress: number;
    },
    forcedSinking?: number;
  };
  cheep?: {
    direction: 1 | -1;
    amplitude: number;
    ySpeed: number;
    speed: number;
    y: number;
    yDir: 1 | -1;
  };
  displace?: {
    x: number;
    y: number;
  };
  gotHit?: {
    x: number;
    y: number;
    by: 'fireball' | 'bonk' | 'star' | 'shell' | 'soft-bonk';
  };
  goThrougWalls?: boolean;
  mushroom?: boolean;
  oneUp?: boolean;
  powerup?: boolean;
  star?: boolean;
  bonked?: boolean;
  collectedCoin?: {
    lifetime: number;
  };
  followCam?: boolean;
  pipe?: {
    path: Points;
    from: "u" | "d" | "l" | "r";
    to: "u" | "d" | "l" | "r";
  };
  coin?: boolean;
  sensor?: boolean;
  moving?: boolean;
  coinGotCollected?: boolean;
  spring?: {
    h: number;
    progress?: number;
  };
  platform?: {
    oscillate?: {
      from: Vec2d;
      to: Vec2d;
      middle: Vec2d;
      freq: number;
      t: number;
      phase: number;
    };
    fall?: boolean;
    crumble?: boolean;
    moveTo?: {
      location: Vec2d;
      dieWhenReached?: boolean;
      stop?: boolean;
    };
    bounded?: {
      top: number;
      bottom: number;
    }
  };
  platformConnection?: {
    p1: Entity;
    p2: Entity;
    p1H: number;
    p2H: number;
    rope1: Entity;
    rope2: Entity;
    cut?: boolean;
  };
  platformConnectionIsConnected?: boolean;
  iframesSecs?: number;
  deleteOutOfCam?: boolean;
  deleteTimer?: number;
  maxSpeed?: number;

  /** In degrees */
  angVel?: number;
};

export function newEntity(init?: Partial<Entity>): Entity {
  const newEnt: Entity = {
    positionStart: new Vec2d(0, 0),
    positionPrev: new Vec2d(0, 0),
    position: new Vec2d(0, 0),
    size: new Vec2d(0, 0),
    dynamicIndex: -1,
    staticIndex: -1,
    kinematicIndex: -1,
    sensorIndex: -1
  };
  Object.assign(newEnt, init);
  return newEnt;
}

const entities = new Ecs<Entity>();

export default entities;