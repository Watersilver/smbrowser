import entities from "../entities";
import newClutter from "../entityFactories/newClutter";

// TODO: vine climb

// TODO: Trampolines

// TODO: Bowserfire, Jumping fish, bullet bill etc zones.

// TODO: Goomba

// TODO: Koopa Troopa green

// TODO: Koopa Troopa red

// TODO: Koopa paratroopa green

// TODO: Koopa paratroopa green

// TODO: Piranha plants

// TODO: Enemy spawners

// TODO: Death and respawn and checkpoints

export default function vines(dt: number) {

  // Grow
  for (const e of entities.view(['vine', 'moving'])) {
    if (!e.vine) continue;

    // compute new size and position
    e.size.y += (e.vine.targetHeight - e.size.y) * dt * 0.9 * 5;
    if (e.vine.targetHeight - e.size.y < 0.1) e.size.y = e.vine.targetHeight;
    const bottom = e.vine.root.smb1TilesSprites?.container.position.y ?? e.vine.root.position.y;
    e.position.y = bottom - e.size.y * 0.5;

    // Create new parts
    while (Math.ceil((e.size.y) / 16) > e.vine.parts.length) {
      const v = newClutter(0, 0, {type: 'object', frame: e.vine.parts.length ? 'vine' : 'vinetop'});
      if (v.smb1ObjectsSprites?.container) {
        const cont = v.smb1ObjectsSprites.container;
        cont.zIndex = -2;
        cont.visible = false;
        cont.position.x = e.vine.root.position.x;
        setTimeout(() => cont.visible = true);
      }
      e.vine.parts.push(v);
    }

    // Move parts
    const top = bottom - e.size.y;
    for (let i = 0; i < e.vine.parts.length; i++) {
      const part = e.vine.parts[i];
      if (part?.smb1ObjectsSprites) {
        part.smb1ObjectsSprites.container.position.y = top + i * 16;
      }
    }

    // Become static if done growing
    if (e.size.y === e.vine.targetHeight) {
      delete e.moving;
    }
  }
}
