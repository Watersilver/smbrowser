// import { getSmb1Audio } from "../audio";
import entities from "../entities";

// const audio = getSmb1Audio();

export default function marioPowerups(dt: number) {
  for (const e of entities.view([
    'mario'
  ])) {
    const mario = e.mario;

    if (mario) {
      if (mario.star !== undefined) {
        // if (audio.music.getMusic()?.name !== 'mustest') {
        //   audio.music.setMusic({name: 'mustest'});
        // }
        mario.star -= dt;
        if (mario.star <= 0) delete mario.star;
      } else {
        // if (audio.music.getMusic()?.name) {
        //   audio.music.setMusic({})
        // }
      }
    }
  }
}