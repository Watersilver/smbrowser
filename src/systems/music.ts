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
      if (musicZone.music === 'smb1overworld') {
        audio.music.setMusic({
          name: 'smb1overworld',
          loopStart: 26.036,
          loopEnd: 156.037
        });
      } else if (musicZone.music === 'smb2overworld') {
        audio.music.setMusic({
          name: 'smb2overworld',
          loopStart: 11.313,
          loopEnd: 127.061
        });
      } else if (musicZone.music === 'smb3overworld') {
        audio.music.setMusic({
          name: 'smb3overworld',
          loopStart: 0,
          loopEnd: 219.05
        });
      } else if (musicZone.music === 'smwoverworld') {
        audio.music.setMusic({
          name: 'smwoverworld',
          loopStart: 66.247,
          loopEnd: 183.591
        });
      } else if (musicZone.music === 'smb1underground') {
        audio.music.setMusic({
          name: 'smb1underground',
          loopStart: 0,
          loopEnd: 160.731
        });
      } else if (musicZone.music === 'smb1castle') {
        audio.music.setMusic({
          name: 'smb1castle',
          loopStart: 26.222 -10.5270,
          loopEnd: 101.866 -10.5270
        });
      } else if (musicZone.music === 'sml2athletic') {
        audio.music.setMusic({
          name: 'sml2athletic',
          loopStart: 53.236,
          loopEnd: 104.434
        });
      } else if (musicZone.music === 'smwathletic') {
        audio.music.setMusic({
          name: 'smwathletic',
          loopStart: 38.164,
          loopEnd: 149.663
        });
      } else if (musicZone.music === 'bowser') {
        audio.music.setMusic({
          name: 'bowser',
          loopStart: 59.816,
          loopEnd: 115.874
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