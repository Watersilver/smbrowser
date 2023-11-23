import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import smb1Sprites from "../sprites/smb1";

export default function newMario(x: number, y: number) {
  const smb1MarioAnimations = smb1Sprites.getFactory('mario').new();
  smb1MarioAnimations.container.zIndex = 10;
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    touchingUp: [],
    touchingDown: [],
    touchingLeft: [],
    touchingRight: [],
    hits: [],
    prevHits: [],
    size: new Vec2d(12, 15),
    dynamic: {
      velocity: new Vec2d(0, 0),
      acceleration: new Vec2d(0, 0)
    },
    player: {
      coins: 0,
      lives: 3,
      kicks8k: 0
    },
    marioInput: {inputs: {}},
    marioMovementConfig: {
      minWalkSpeed: 0x00130 * 60 / 0x01000,
      maxWalkSpeed: 0x01900 * 60 / 0x01000,
      walkAccel: 0x00098 * 60 * 60 / 0x01000,
      maxWalkSpeedUnderwater: 0x01100 * 60 / 0x01000,
      cutsceneWalkSpeed: 0x00D00 * 60 / 0x01000,
      maxRunSpeed: 0x02900 * 60 / 0x01000,
      runAccel: 0x000E4 * 60 * 60 / 0x01000,
      releaseDecel: 0x000D0 * 60 * 60 / 0x01000,
      skidDecel: 0x001A0 * 60 * 60 / 0x01000,
      skidTurnaround: 0x00900 * 60 / 0x01000,
      jumpBackwardsDecelThreshold: 0x01D00 * 60 / 0x01000,
      jumpFastAccel: 0x000E4 * 60 * 60 / 0x01000,
      jumpSlowAccel: 0x00098 * 60 * 60 / 0x01000,
      jumpFastDecel: 0x000E4 * 60 * 60 / 0x01000,
      jumpNormalDecel: 0x000D0 * 60 * 60 / 0x01000,
      jumpSlowDecel: 0x00098 * 60 * 60 / 0x01000,
      initFallGravity: 0x00280 * 60 * 60 / 0x01000,
      initJumpGravity: 0x00280 * 60 * 60 / 0x01000,
      walkGravitySpeed: 0x01000 * 60 / 0x01000,
      walkJump: 0x04000 * 60 / 0x01000,
      walkFallGravity: 0x00700 * 60 * 60 / 0x01000,
      walkJumpGravity: 0x00200 * 60 * 60 / 0x01000,
      midGravitySpeed: 0x024FF * 60 / 0x01000,
      midJump: 0x04000 * 60 / 0x01000,
      midFallGravity: 0x00600 * 60 * 60 / 0x01000,
      midJumpGravity: 0x001E0 * 60 * 60 / 0x01000,
      runJump: 0x05000 * 60 / 0x01000,
      runFallGravity: 0x00900 * 60 * 60 / 0x01000,
      runJumpGravity: 0x00280 * 60 * 60 / 0x01000,
      swimJump: 0x01800 * 60 / 0x01000,
      swimFallGravity: 0x000A0 * 60 * 60 / 0x01000,
      swimJumpGravity: 0x000D0 * 60 * 60 / 0x01000,
      whirlpoolJump: 0x01000 * 60 / 0x01000,
      whirlpoolFallGravity: 0x00090 * 60 * 60 / 0x01000,
      whirlpoolJumpGravity: 0x00040 * 60 * 60 / 0x01000,
      surfaceJump: 0x01800 * 60 / 0x01000,
      surfaceFallGravity: 0x00180 * 60 * 60 / 0x01000,
      surfaceJumpGravity: 0x00180 * 60 * 60 / 0x01000
    },
    mario: {
      facing: 1,
      damageCounter: 0,
      deathCounter: 0,
      timer: 0
    },
    floorSpeed: 0,
    gravity: 0,
    smb1MarioAnimations,
    followCam: true
  }));
}