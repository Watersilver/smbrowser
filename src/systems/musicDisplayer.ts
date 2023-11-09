import { getSmb1Audio } from "../audio"
import nobledemon from '../assets/avatars/nobledemon.jpg'

// Preload artist avatars
for (const img of [nobledemon]) {
  const preloader = document.createElement('link');
  preloader.rel = 'preload';
  preloader.href = img;
  preloader.as = 'image';
  document.body.append(preloader);
}

const div = document.createElement('div');
div.style.transition = `all ease-in-out 1s`;
div.style.pointerEvents = 'none';
div.style.position = 'fixed';
div.style.bottom = '0';
div.style.transform = 'TranslateY(100%)';
div.style.padding = '24px';
document.body.append(div);

const card = document.createElement('a');
card.target = '_blank';
div.style.pointerEvents = 'auto';
// card.rel = "noreferrer nofollow";
card.style.borderRadius = '100%';
card.style.backgroundColor = 'white';
card.style.display = 'flex';
card.style.alignItems = 'center';
div.append(card);

const imgContainer = document.createElement('div');
imgContainer.style.padding = '8px';
imgContainer.style.borderRadius = '100%';
card.append(imgContainer);

const img = document.createElement('img');
img.style.transition = `all ease-in-out 1s`;
img.style.opacity = '0';
img.style.width = '48px';
img.style.height = '48px';
imgContainer.append(img);

const text = document.createElement('span');
text.style.transition = `all ease-in-out 1s`;
text.style.fontSize = '0';
text.style.opacity = '0';
card.append(text);

const audio = getSmb1Audio();

type MusicName = NonNullable<NonNullable<ReturnType<(typeof audio.music.getMusic)>>['name']>;

const authorMap: {
  [key in MusicName]: {
    link: string;
    img: string;
    name: string;
  }
} = {
  'mustest': {
    link: 'hello',
    img: 'ass',
    name: 'My Ass'
  },
  'smb3underwater': {
    'link': 'https://www.youtube.com/watch?v=QfaMmbUivqk',
    'img': nobledemon,
    'name': 'Super Mario Bros. 3: Underwater Orchestral Arrangement'
  }
}

// TODOS:
// Make it not suck
// Make it appear during pauses
// Make it consecutive
// Make music zones
// - set music zone
// - stop music zone
// Loading screen should have loaders (percentages) and be black until loaded
// make entity that teleports camera
// Title screen should also start black and wait a few secs for level to load
// Then wait a bit before "press enter to start playing appears"
// when enter pressed delete entity that forces camera to it and camera will go to mario

class MusicDisplayer {
  private next?: MusicName;
  private hidden = true;
  private hideTime = 0;
  private recharge = 0;

  setNext(next: MusicName) {
    this.next = next;
  }

  update(dt: number, paused: boolean) {
    if (!this.hidden && this.hideTime === 0) {
      this.recharge -= dt;
      this.recharge = Math.max(0, this.recharge);

      if (this.recharge === 0) this.hidden = true;
    }

    if (this.hideTime === 0) {
      this.recharge = 1;

      // Hide ui
      div.style.transform = 'TranslateY(100%)';
      text.style.fontSize = '0';
      text.style.opacity = '0';
      img.style.opacity = '0';
    }

    if (paused) {
      this.hideTime = Math.max(this.hideTime, 1);
    } else {
      this.hideTime -= dt;
      this.hideTime = Math.max(0, this.hideTime);
    }

    if (this.next) {
      if (this.hidden) {
        this.hidden = false;
        this.hideTime = 5;

        // Show ui
        const data = authorMap[this.next];
        text.innerText = data.name;
        img.src = data.img;
        card.href = data.link;
        div.style.transform = 'TranslateY(0%)';
        text.style.fontSize = '20px';
        text.style.opacity = '1';
        img.style.opacity = '1';

        delete this.next;
      } else {
        this.hideTime = 0;
      }
    }
  }
}

const musicDisplayer = new MusicDisplayer();

export default musicDisplayer;