import { getSmb1Audio } from "../audio";
import { Vec2d } from "../engine";
import entities from "../entities";
import newDeadMario from "../entityFactories/newDeadMario";

// Preload views
entities.view(['mario']);

const audio = getSmb1Audio();

export default function deathAndRespawn(dt: number, props: {respawnTimer?: number}) {
  if (props.respawnTimer !== undefined) {
    props.respawnTimer -= dt;

    if (props.respawnTimer <= 0) {
      delete props.respawnTimer;

      for (const e of entities.view(['mario'])) {
        delete e.mario?.dead;
        window.setTimeout(() => e.smb1MarioAnimations && (e.smb1MarioAnimations.container.visible = true));
        e.iframesSecs = 2;

        e.dynamic = {
          acceleration: new Vec2d(0, 0),
          velocity: new Vec2d(0, 0)
        }
        e.position.x = e.mario?.respawnPoint?.x ?? e.positionStart.x;
        e.position.y = e.mario?.respawnPoint?.y ?? e.positionStart.y;
      }
    }
  } else {
    for (const e of entities.view(['mario'])) {
      if (e.mario?.dead) {
        if (e.player) {
          e.player.lives -= 1;
        }
        if (e.smb1MarioAnimations) {
          e.smb1MarioAnimations.container.visible = false;
        }
        delete e.dynamic;
        newDeadMario(e.position.x, e.position.y);
        audio.sounds.play('mariodiestart');

        props.respawnTimer = 1.5;
      }
    }
  }
}