import entities from "../entities";

export default function deathZones(lowestY: number) {
  for (const e of entities.view(['dynamic'])) {
    if (e.position.y > lowestY) entities.remove(e);
  }
}