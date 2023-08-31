import { Vec2d } from "../engine";
import entities, { newEntity } from "../entities";
import { Points } from "../types";

export default function newPipe(path: Points) {
  const first = path[0];
  const second = path[1];
  const last = path.at(-1);
  const penultimate = path.at(-2);

  const x = first?.[0] ?? 0;
  const y = first?.[1] ?? 0;

  const from =
    !first || !second
    ? 'u'
    : first[0] < second[0]
    ? 'r'
    : first[0] > second[0]
    ? 'l'
    : first[1] < second[1]
    ? 'd'
    : 'u';

  const to =
    !last || !penultimate
    ? 'u'
    : penultimate[0] < last[0]
    ? 'r'
    : penultimate[0] > last[0]
    ? 'l'
    : penultimate[1] < last[1]
    ? 'd'
    : 'u';

  return entities.createEntity(newEntity({
    position: new Vec2d(x, y),
    size: new Vec2d(16, 16),
    dynamic: {
      velocity: new Vec2d(0, 0),
      acceleration: new Vec2d(0, 0)
    },
    pipe: {
      path,
      from,
      to
    }
  }));
}