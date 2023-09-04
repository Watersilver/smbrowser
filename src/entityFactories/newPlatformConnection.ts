import { Vec2d } from "../engine";
import entities, { Entity, newEntity } from "../entities";
import newClutter from "./newClutter";

export default function newPlatformConnection(
  x: number,
  y: number,
  p1: Entity,
  p2: Entity,
  p1H: number,
  ropeLength: number
) {
  newClutter(x, y, {type: 'tile', frame: 'clutterSuspenderLeft'});
  const c = newClutter(0.5 * (p2.position.x + x), y, {type: 'tile', frame: 'clutterSuspenderRope'});
  if (c.smb1TilesSprites) c.smb1TilesSprites.container.scale.x = (p2.position.x - (x + 16)) / 16;
  newClutter(p2.position.x, y, {type: 'tile', frame: 'clutterSuspenderRight'});
  const rope1 = newClutter(x, y + 8, {type: 'tile', frame: 'clutterSuspenderRopeVertical'});
  const rope2 = newClutter(p2.position.x, y + 8, {type: 'tile', frame: 'clutterSuspenderRopeVertical'});
  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(0, 0),
    platformConnection: {
      p1, p2, p1H,
      p2H: ropeLength - p1H,
      rope1,
      rope2
    },
    platformConnectionIsConnected: true
  }));
}