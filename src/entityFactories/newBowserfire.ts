import entities, { Entity } from "../entities";
import newEnemy from "./newEnemy";

export default function newBowserfire(x: number, y: number, targetY?: number) {
  const e = newEnemy(x, y, 'bowserfire');
  e.size.y = 2;

  e.enemy = {
    star: false,
    stomp: false,
    shell: false,
    fireball: false
  };
  const closest = entities.view(['mario']).reduce<Entity | undefined>((a, c) => {
    if (!a) return c;
    if (Math.abs(c.position.x - e.position.x) < Math.abs(c.position.x - e.position.x)) return c;
    return a;
  }, undefined);
  e.fire = {
    direction: !closest ? 1 : (closest.position.x - e.position.x) < 0 ? -1 : 1,
    targetY
  };
  e.sensor = true;
  e.moving = true;
  if (e.smb1EnemiesAnimations) {
    e.smb1EnemiesAnimations.container.scale.x = -e.fire.direction;
    e.smb1EnemiesAnimations.loopsPerSecond *= 2;
  }

  return e;
}