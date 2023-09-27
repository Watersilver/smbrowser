import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Smb1ObjectsSprites } from "../sprites/loaders/smb1/objects";
import smb1Sprites from "../sprites/smb1";

export default function newFirebar(x: number, y: number, size: number, angle: number, angvel: number) {
  const firebar = entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(0, 0),
    firebar: {angle, angvel}
  }));

  for (let l = 0; l < size; l += 8) {
    const f = smb1Sprites.getFactory('animObjects').new();
    f.setAnimation('fireball');
    f.loopsPerSecond = 3;
    entities.createEntity(newEntity({
      size: new Vec2d(4, 4),
      firebarFireball: {
        parent: firebar,
        length: l
      },
      smb1ObjectsAnimations: f,
      moving: true,
      sensor: true,
      enemy: {
        fireball: false,
        stomp: false,
        shell: false,
        star: false,
        fireballGoesThrough: true
      }
    }));
  }

  return firebar;
}