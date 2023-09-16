import { Display } from "../display";
import { Vec2d } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";

const rect = new Collidable();

export default function enemyActivator(display: Display) {
  
  for (const e of entities.view(['enemActivateOnVisible'])) {
    
    const eaov = e.enemActivateOnVisible;

    if (!eaov) continue;

    rect.set(e);
    rect.pos.x--;
    rect.pos.y--;
    rect.size.x += 2;
    rect.size.y += 2;

    if (!display.overlapsRectBroad(rect)) continue;

    let dontDelete = false;

    switch (eaov) {
      case 'goomba':
        e.movement = {
          horizontal: -50,
          horizontalNow: true,
          flipEachOther: true
        };
        e.dynamic = {velocity: new Vec2d(0, 0), acceleration: new Vec2d(0, 0)};
        e.hits = [];
        e.gravity = 600;
        e.enemy = {
          star: true,
          stomp: true,
          fireball: true
        };
        e.touchingDown = [];
        break;
      case 'bouncyKoop':
      case 'bowser':
      case 'bruce':
      case 'cheep':
      case 'flyingKoopa':
      case 'hammerbro':
      case 'koopaG':
      case 'koopaR':
      case 'plant':
      default:
        dontDelete = true;
    }

    if (!dontDelete) delete e.enemActivateOnVisible;
  }
}