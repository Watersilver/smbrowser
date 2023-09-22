import { getSmb1Audio } from "../audio";
import { Sound } from "../engine/audio-controller";
import entities from "../entities";

const audio = getSmb1Audio();

let coinTimer = Date.now();
let coinSound: Sound | null = null;
let swimSound: Sound | null = null;

entities.onPropChange('coinGotCollected', e => {
  if (e.coinGotCollected) {
    const prev = coinTimer;
    coinTimer = Date.now();
    if (coinTimer - prev < 5) return;
    coinSound?.stop();
    coinSound = audio.sounds.play('coin');
  }
});

export default function marioSmb1Sounds() {
  for (const e of entities.view(['mario'])) {
    if (e.mario?.inPipe?.started) {
      audio.sounds.play('pipe');
    }
  }

  for (const e of entities.view(['mario', 'dynamic'])) {
    const m = e.mario;
    if (m) {
      if (m.jumped) {
        if (e.underwater) {
          swimSound?.stop();
          swimSound = audio.sounds.play('stomp');
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

      if (m.shot) {
        audio.sounds.play('fireball');
      }

      if (e.player) {
        if (e.player.gainedPow) {
          audio.sounds.play('powerup');
        }
  
        if (e.player.gainedOneUp) {
          audio.sounds.play('oneUp');
        }
      }
    }
  }

  for (const e of entities.view(['bonk'])) {
    if (e.bonk && !e.smash) {
      audio.sounds.play('bump');
    }
  }

  for (const e of entities.view(['smash'])) {
    if (e.smash) {
      audio.sounds.play('breakblock');
    }
  }

  for (const e of entities.view(['vineStart'])) {
    if (e.vineStart) {
      audio.sounds.get('powerup_appears').forEach(s => s.stop());
      audio.sounds.play('vine');
    }
    delete e.vineStart;
  }
}