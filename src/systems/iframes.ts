import entities from "../entities";

// Preload views
entities.view(['iframesSecs']);

export default function iframes(dt: number) {
  for (const e of entities.view(['iframesSecs'])) {
    if (e.iframesSecs === undefined) continue;

    e.iframesSecs -= dt;

    if (e.iframesSecs <= 0) {
      delete e.iframesSecs;
    }
  }
}