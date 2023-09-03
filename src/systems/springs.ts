import entities from "../entities";

const springSpeed = Math.PI * 1.5;

entities.onAdding(['spring'], e => {
  if (e.smb1ObjectsAnimations) {
    e.smb1ObjectsAnimations.loopsPerSecond = 0;
  }
});

export default function springs(dt: number) {
  for (const e of entities.view(['spring', 'touchingUp', 'hits'])) {

    if (!e.spring) continue;

    if (e.spring.progress !== undefined) continue;

    const mario = e.touchingUp?.find(t => t.mario);
    if (mario && e.hits?.find(h => h.e === mario && h.normal.y < 0)) {
      if (mario.mario) {
        mario.mario.onSpring = {
          spring: e,
          vx: mario.dynamic?.velocity.x ?? 0
        };
      }
      e.spring.progress = 0;
    }
  }

  for (const e of entities.view(['spring'])) {
    if (e.spring?.progress === undefined) continue;

    e.smb1ObjectsAnimations?.setProgress(Math.sin(e.spring.progress));

    e.spring.progress += dt * springSpeed;

    if (e.spring.progress >= Math.PI) {
      delete e.spring.progress;
    }
  }
}