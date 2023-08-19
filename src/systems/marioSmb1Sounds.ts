import { getSmb1Audio } from "../audio";
import entities from "../entities";
import didHitHead from "./utils/didHitHead";

const audio = getSmb1Audio();

const swimSoundOptions = {stopPrev: {same: true}};

export default function marioSmb1Sounds() {
  for (const e of entities.view(['mario'])) {
    const m = e.mario;
    if (m) {
      if (m.jumped) {
        if (e.underwater) {
          audio.sounds.play('stomp', swimSoundOptions);
        } else {
          if (m.big) {
            audio.sounds.play('jumpBig');
          } else {
            audio.sounds.play('jumpSmall');
          }
        }
      }

      if (m.changedSize) {
        if (m.big) {
          audio.sounds.play('powerup');
        } else {
          audio.sounds.play('pipe');
        }
      }
    }
  }

  for (const e of entities.view(['mario', 'hits', 'prevHits'])) {
    if (e.bonk) {
      audio.sounds.play('bump');
    }
  }
}