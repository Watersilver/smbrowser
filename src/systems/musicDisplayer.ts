import { getSmb1Audio } from "../audio"
import nobledemon from '../assets/avatars/nobledemon.png'

// Preload artist avatars
for (const img of [nobledemon]) {
  const preloader = document.createElement('link');
  preloader.rel = 'preload';
  preloader.href = img;
  preloader.as = 'image';
  document.body.append(preloader);
}

const root = document.createElement('div');
// root.style.pointerEvents = 'none';
root.style.position = 'fixed';
root.style.left = '0';
root.style.bottom = '0';
let mousingOverMusic = false;
root.onmouseover = () => {
  mousingOverMusic = true;
};
root.onmouseleave = () => {
  mousingOverMusic = false;
};
document.body.append(root);

const div = document.createElement('div');
div.style.pointerEvents = 'none';
// div.style.position = 'fixed';
// div.style.left = '0';
// div.style.bottom = '0';
div.style.transform = 'TranslateY(100%)';
div.style.padding = '24px';
root.append(div);

const card = document.createElement('a');
card.target = '_blank';
card.style.pointerEvents = 'auto';
// card.rel = "noreferrer nofollow";
card.style.border = '4px solid #fff';
card.style.backgroundColor = '#fff';
card.style.borderRadius = '9999px';
card.style.display = 'flex';
card.style.alignItems = 'center';
card.style.textDecoration = 'none';
div.append(card);

const imgContainer = document.createElement('div');
imgContainer.style.padding = '8px';
imgContainer.style.borderRadius = '9999px';
card.append(imgContainer);

const img = document.createElement('img');
img.style.opacity = '0';
img.style.width = '48px';
img.style.height = '48px';
imgContainer.append(img);

const text = document.createElement('span');
text.style.fontSize = '0';
text.style.opacity = '0';
text.style.fontFamily = "Mario";
text.style.color = 'black';
card.append(text);

const audio = getSmb1Audio();
(window as any).audio = audio;

type MusicName = NonNullable<NonNullable<ReturnType<(typeof audio.music.getMusic)>>['name']>;

const authorMap: {
  [key in MusicName]: {
    link: string;
    img: string;
    name: string;
  }
} = {
  'smb3underwater': {
    'link': 'https://www.youtube.com/watch?v=QfaMmbUivqk',
    'img': nobledemon,
    'name': 'Super Mario Bros. 3: Underwater Orchestral Arrangement'
  }
}

// TODOS:
// BUG: Flag work opposite in chrome...
// Make music zones
// - set music zone
// - stop music zone
// Then wait a bit before "press enter to start playing appears"
// when enter pressed delete entity that forces camera to it and camera will go to mario
// Memory issues... :(

const showStep1Dur = 0.6;
const showStep2Dur = 0.4;
const showStep3Dur = 0.2;
const hideStep1Dur = 0.6;
const hideStep2Dur = 0.4;
const hideStep3Dur = 0.2;

class MusicDisplayer {
  private current?: MusicName;
  private next?: MusicName;
  private hidden = true;
  private hideTime = 0;
  private recharge = 0;

  setNext(next: MusicName) {
    this.next = next;
  }

  deleteData() {
    this.next = undefined;
  }

  private step = 0;
  private animTimeout: number | null = null;
  private showing = false;
  private showStep1() {
    div.style.transition = `all ease-in-out ${showStep1Dur}s`;
    div.style.transform = 'TranslateY(0%)';
  }
  private showStep2() {
    text.style.transition = `all ease-in-out ${showStep2Dur}s`;
    text.style.fontSize = '10px';
    text.style.paddingRight = '8px';
  }
  private showStep3() {
    text.style.transition = `all ease-in-out ${showStep3Dur}s`;
    img.style.transition = `all ease-in-out ${showStep3Dur}s`;
    card.style.transition = `all ease-in-out ${showStep3Dur}s`;
    card.style.backgroundColor = '#ffffffff';
    text.style.opacity = '1';
    img.style.opacity = '1';
  }
  private hideStep1() {
    div.style.transition = `all ease-in-out ${hideStep1Dur}s`;
    div.style.transform = 'TranslateY(100%)';
  }
  private hideStep2() {
    text.style.transition = `all ease-in-out ${hideStep2Dur}s`;
    text.style.fontSize = '0';
    text.style.paddingRight = '0';
  }
  private hideStep3() {
    text.style.transition = `all ease-in-out ${hideStep3Dur}s`;
    img.style.transition = `all ease-in-out ${hideStep3Dur}s`;
    card.style.transition = `all ease-in-out ${showStep3Dur}s`;
    card.style.backgroundColor = '#ffffff';
    text.style.opacity = '0';
    img.style.opacity = '0';
  }
  show() {
    if (this.showing || !this.current) return;
    this.showing = true;
    if (this.animTimeout !== null) {
      window.clearTimeout(this.animTimeout);
      this.animTimeout = null;
    }
    if (this.step === 0) {
      this.showStep1();
      this.step++;
      this.animTimeout = window.setTimeout(() => {
        this.showing = false;
        this.show();
        this.showing = true;
      }, showStep1Dur * 1000);
    } else if (this.step === 1) {
      this.showStep2();
      this.step++;
      this.animTimeout = window.setTimeout(() => {
        this.showing = false;
        this.show();
        this.showing = true;
      }, showStep2Dur * 1000);
    } else if (this.step === 2) {
      this.showStep3();
      this.step++;
      this.animTimeout = null;
    }
  }

  hide() {
    if (!this.showing) return;
    this.showing = false;
    if (this.animTimeout !== null) {
      window.clearTimeout(this.animTimeout);
      this.animTimeout = null;
    }
    if (this.step === 1) {
      this.hideStep1();
      this.step--;
      this.animTimeout = null;
    } else if (this.step === 2) {
      this.hideStep2();
      this.step--;
      this.animTimeout = window.setTimeout(() => {
        this.showing = true;
        this.hide();
        this.showing = false;
      }, hideStep2Dur * 1000);
    } else if (this.step === 3) {
      this.hideStep3();
      this.step--;
      this.animTimeout = window.setTimeout(() => {
        this.showing = true;
        this.hide();
        this.showing = false;
      }, hideStep3Dur * 1000);
    }
  }

  update(dt: number, paused: boolean) {
    if (!this.hidden && this.hideTime === 0) {
      this.recharge -= dt;
      this.recharge = Math.max(0, this.recharge);

      if (this.recharge === 0) this.hidden = true;
    }

    if (this.hideTime === 0) {
      if (this.recharge === 0) this.recharge = 1;

      this.hide();
    }

    if (paused || mousingOverMusic) {
      this.hideTime = 1;
      this.show();
    } else {
      this.hideTime -= dt;
      this.hideTime = Math.max(0, this.hideTime);
    }

    if (this.next) {
      if (this.hidden) {
        this.current = this.next;

        this.hidden = false;
        this.hideTime = 5;

        // Show ui
        const data = authorMap[this.next];
        text.innerText = data.name;
        img.src = data.img;
        card.href = data.link;

        this.show();

        delete this.next;
      } else {
        this.hideTime = 0;
      }
    }
  }
}

const musicDisplayer = new MusicDisplayer();

export default musicDisplayer;