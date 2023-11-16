import { getSmb1Audio } from "../audio";
import { aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import zones from "../zones";

const audio = getSmb1Audio();

const c1 = new Collidable();

export default function music() {

  let i = 0;
  for (const musicZone of zones.angrySun) {
    c1.setToZone(musicZone);
    const isIn = entities.view(['mario']).some(m => {
      return aabb.pointVsRect(m.position, c1);
    });
    if (isIn) {
      audio.music.setMusic({
        name: musicZone.music as any
      });
      zones.angrySun.splice(i, 1);
      break;
    }
    i++;
  }
}