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
      audio.sounds.get('stage_clear').forEach(s => s.stop());
      if (musicZone.music === 'smb1overworld') {
        audio.music.setMusic({
          name: 'overworld_tune1'
        });
      } else if (musicZone.music === 'smb2overworld') {
        audio.music.setMusic({
          name: 'mushroom1'
        });
      } else if (musicZone.music === 'smb3overworld') {
        audio.music.setMusic({
          name: 'overworld2'
        });
      } else if (musicZone.music === 'smwoverworld') {
        audio.music.setMusic({
          name: 'overworld3'
        });
      } else if (musicZone.music === 'smb1underwater') {
        audio.music.setMusic({
          name: 'underwater'
        });
      } else if (musicZone.music === 'smb1underground') {
        audio.music.setMusic({
          name: 'underground'
        });
      } else if (musicZone.music === 'smb1castle') {
        audio.music.setMusic({
          name: "CASTLE_THEME_1"
        });
      } else if (musicZone.music === 'sml2athletic') {
        audio.music.setMusic({
          name: 'mushroom2'
        });
      } else if (musicZone.music === 'smwathletic') {
        audio.music.setMusic({
          name: 'overworld4'
        });
      } else if (musicZone.music === 'bowser') {
        audio.music.setMusic({
          name: 'final_castle'
        });
      } else if (!musicZone.music) {
        audio.music.setMusic({
          fadeOutPrev: 3
        });
      } else {
        audio.music.setMusic({
          name: musicZone.music as any
        });
      }
      zones.angrySun.splice(i, 1);
      break;
    }
    i++;
  }
}