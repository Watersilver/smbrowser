import { Container, Graphics, Text } from "pixi.js";
import { Display } from "../display";
import entities, { Entity } from "../entities";
import { Vec2d } from "../engine";
import { getSmb1Audio } from "../audio";

// Preload views
entities.view(['finalCutscene']);

const audio = getSmb1Audio();

const createFullscreenIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"/></svg>`;
const createShrinkIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M160 64c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V64zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32H96v64c0 17.7 14.3 32 32 32s32-14.3 32-32V352c0-17.7-14.3-32-32-32H32zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H352V64zM320 320c-17.7 0-32 14.3-32 32v96c0 17.7 14.3 32 32 32s32-14.3 32-32V384h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H320z"/></svg>`;

const g = document.getElementById('game');
function fullscreenTrigger() {
  try {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      g?.requestFullscreen();
    }
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener('keydown', e => {
  if (e.code === 'KeyF') {
    fullscreenTrigger();
  }
});
const f = document.getElementById('fullscreen');
if (f) f.onclick = fullscreenTrigger;


const credits = `
~Credits~


Art

  ProsciuttoMan

Music
  
  Teravex

  "He's My Bird (Tapper)", Dry

Programming

  WaterSilverC

Font

  TheWolfBunny64

Special Thanks

  Pixi.js team
    for the great rendering library

  https://nesmaps.com
    for the amazing map guides

  Jdaster64
    for the exhaustive
    smb1 Physics Guide

  Javidx9
    for the great aabb
    physics system guide


  and You for playing!






  Stats:
`
function createCredits(text: string) {
  const c = new Container();
  const lines = text.split('\n');
  let nextY = 0;
  for (const line of lines) {
    if (line.trim()) {
      const title = line === line.trimStart();
      const subitem = line.includes('    ');
      const item = !subitem && line.includes('  ');
      const t = new Text(line.trim(), {
        fontFamily: "Mario",
        fill: title ? '#ccf' : subitem ? '#f99' : 'white',
        strokeThickness: 5
      });
      t.position.y = nextY;
      t.scale.set(0.2);
      if (title) {
        t.position.y = nextY;
        t.anchor.set(0.5);
        t.scale.set(0.3);
      } else if (item) {
        t.anchor.set(0, 0.5);
        t.position.x = -50;
      } else if (subitem) {
        t.anchor.set(0, 0.5);
        t.position.x = -40;
      }
      c.addChild(t);
    }

    nextY += 12;
  }
  return c;
}

// HOLE EXAMPLE:
// https://pixijs.com/examples/graphics/advanced

export default class Overlay {
  private display: Display;
  private overlay = new Container();
  private fade = new Graphics();
  private pauseText: Text;
  private restartText: Text;
  private credits: Container | null = null;

  constructor(display: Display) {
    this.overlay.zIndex = 9999999999;
    this.overlay.addChild(this.fade);
    this.display = display;
    this.display.add(this.overlay);

    this.pauseText = new Text('Paused', {
      fontFamily: "Mario",
      fill: 'white',
      strokeThickness: 5
    });
    this.pauseText.anchor.set(0.5);
    this.overlay.addChild(this.pauseText);
    this.pauseText.visible = false;

    this.restartText = new Text('Press "Enter" to go back to title', {
      fontFamily: "Mario",
      fill: '#aaa'
    });
    this.restartText.anchor.set(0.5);
    this.overlay.addChild(this.restartText);
    this.restartText.visible = false;
  }

  private is_destroyed = false;
  destroyed() {return this.is_destroyed;}

  destroy() {
    this.is_destroyed = true;
    this.overlay.removeFromParent();
    this.overlay.destroy();
  }

  setRestartText(t: string) {
    this.restartText.text = t;
  }

  private fullscreenPrev: boolean | null = null;
  update(dt: number, paused: boolean, hud?: boolean) {
    // // To avoid weird zoom in effect
    // const {l, t} = this.display.getBoundingBox();
    // // Set position to top left
    // this.topLeft.position.x = l;
    // this.topLeft.position.y = t;
    // // Set pivot to minus distance from top left
    // this.topLeft.pivot.x = - 16;
    // this.topLeft.pivot.y = - 16;
    // // Set scale to 1 / display scale
    // this.topLeft.scale.set(1 / this.display.getScale());

    const {l, t, r, b} = this.display.getBoundingBox();

    this.pauseText.position.x = l;
    this.pauseText.position.y = t;
    this.pauseText.pivot.x = - this.display.baseWidth / 2;
    this.pauseText.pivot.y = - this.display.baseHeight / 2;
    this.pauseText.scale.set(1 / this.display.getScale());

    if (paused || hud) {
      const v = document.getElementById('volume');
      if (v) v.style.display = "unset";
      const f = document.getElementById('fullscreen');
      if (f) f.style.display = 'unset';
    }

    if (paused) {
      this.pauseText.visible = true;
    } else {
      this.pauseText.visible = false;
    }

    if (this.fullscreenPrev !== !!document.fullscreenElement) {
      const f = document.getElementById('fullscreen');
      if (f) {
        if (document.fullscreenElement) {
          f.innerHTML = createShrinkIcon();
        } else {
          f.innerHTML = createFullscreenIcon();
        }
      }
    }

    this.fullscreenPrev = !!document.fullscreenElement;

    let fc: Entity | null = null;
    for (const e of entities.view(['finalCutscene'])) {
      fc = e;
    }

    if (!fc) {
      entities.view(['mario']).forEach(m => m.mario && (m.mario.timer += dt));
    }

    this.restartText.position.x = l;
    this.restartText.position.y = t - this.restartText.height;
    this.restartText.pivot.x = - this.display.baseWidth / 2;
    this.restartText.pivot.y = - this.display.baseHeight;
    this.restartText.scale.set(1 / this.display.getScale());
    this.restartText.visible = false;

    this.fade.clear();
    if (typeof fc?.finalCutscene?.fadingOut === 'number' && fc.finalCutscene.close) {
      fc.finalCutscene.fadingOut += dt;
      const x = fc.finalCutscene.close.position.x;
      const y = fc.finalCutscene.close.position.y;

      const distToTL = new Vec2d(x, y).distance({x: l, y: t});
      const distToTR = new Vec2d(x, y).distance({x: r, y: t});
      const distToBL = new Vec2d(x, y).distance({x: l, y: b});
      const distToBR = new Vec2d(x, y).distance({x: r, y: b});
      const maxR = Math.max(distToTL, distToTR, distToBL, distToBR);
      const totalT = 3;
      const radius = Math.max(maxR - (fc.finalCutscene.fadingOut / totalT) * maxR, 0);

      if (fc.finalCutscene.fadingOut - totalT > 2) {
        delete fc.finalCutscene.fadingOut;
        fc.finalCutscene.creditsState = 1;
      }

      this.fade.beginFill(0);
      const w = r - l;
      const h = b - t;
      this.fade.drawRect(l - w / 2, t - h / 2, 2 * w, 2 * h);
      if (radius) {
        this.fade.beginHole();
        this.fade.drawCircle(x, y, radius);
        this.fade.endHole();
      }
      this.fade.endFill();
    } else if (fc?.finalCutscene?.creditsState) {
      this.fade.beginFill(0);
      const w = r - l;
      const h = b - t;
      this.fade.drawRect(l - w / 2, t - h / 2, 2 * w, 2 * h);
      this.fade.endFill();

      if (fc.finalCutscene.creditsState === 1) {
        audio.music.setMusic({
          name: 'Hes_my_bird_tapper',
          noLoop: true
        });
        fc.finalCutscene.creditsState = 2;
        // final ranks:
        // skill:
        // Untouchable (never got hit)
        // Unkillable (hit but not lost a life)
        // Undead (have negative lves)
        // Determined (lost less than four lives but still has lives)
        // Bruised (lost less than ten lives but still has lives)
        // Battered (lost at least 10 lives but still has lives)
        // state:
        // Fiery Hunk (big fire)
        // Small Fire (small fire)
        // little guy (small)
        // Total Chad (big mario no fire)
        // time:
        // the scenery (slow, more than 18 mins)
        // a steady pace (normal, between extremes)
        // pizza and coke (fast, less than 13 mins)
        // also show time explicitly
        const player = entities.view(['player']).at(-1)?.player;
        const mario = entities.view(['mario']).at(-1)?.mario;
        const timeInSecs = mario?.timer ?? 0;
        const timeInMins = timeInSecs / 60;
        const minsFloor = Math.floor(timeInMins);
        const remainingSecs = timeInSecs - minsFloor * 60;

        let skill = "";

        let state = "";

        let time = "";

        if (mario && player) {
          if (mario.damageCounter === 0) {
            skill = 'Untouchable';
          } else if (mario.deathCounter === 0) {
            skill = 'Unkillable';
          } else if (player.lives < 0) {
            skill = 'Undead';
          } else if (mario.deathCounter < 4) {
            skill = 'Determined';
          } else if (mario.deathCounter < 10) {
            skill = 'Bruised';
          } else if (mario.deathCounter >= 10) {
            skill = 'Battered';
          }

          if (mario.big && mario.powerup === 'fire') {
            state = "Fiery Hunk";
          } else if (mario.big) {
            state = "Chad";
          } else if (mario.powerup === 'fire') {
            state = "Small Fire";
          } else {
            state = "little guy";
          }

          if (timeInMins > 18) {
            time = "Enjoyed the scenery :)";
          } else if (timeInMins > 13) {
            time = "Steady pace!";
          } else {
            time = "Pizza and Coke!!";
          }
        }

        const extendedCreds = credits
        + (player?.kicks8k
        ? '    8000 kicks: ' + player?.kicks8k : "")
        + '\n'
        + '    coins: ' + player?.coins
        + '\n'
        + '    lives: ' + player?.lives
        + '\n'
        + '    deaths: ' + mario?.deathCounter
        + '\n'
        + '    damage: ' + mario?.damageCounter
        + '\n'
        + '    Final State: ' + skill + " " + state
        + '\n'
        + '\n'
        + '    time: ' + minsFloor + ":" + remainingSecs.toPrecision(4)
        + '\n'
        + '    Speed Rank: ' + time;

        this.credits = createCredits(extendedCreds);
        this.credits.zIndex = 100;
        this.overlay.addChild(this.credits);
        this.credits.position.x = l + w * 0.5;
        this.credits.position.y = b + 12;
      } else if (fc.finalCutscene.creditsState === 2) {
        if (this.credits) {
          this.credits.position.x = l + w * 0.5;
          this.credits.position.y -= dt * 6;
          const credBottom = this.credits.position.y + this.credits.height;
          const bottomLimit = t + h * 0.7;
          if (credBottom <= bottomLimit) {
            this.credits.position.y = bottomLimit - this.credits.height;
            fc.finalCutscene.creditsState = 3;
            fc.finalCutscene.timeTillRestartPossible = 3;
          }
        }
      } else if (fc.finalCutscene.creditsState === 3) {
        if (fc.finalCutscene.timeTillRestartPossible === 0) {
          this.restartText.visible = true;

          return true;
        }

        if (fc.finalCutscene.timeTillRestartPossible) {
          fc.finalCutscene.timeTillRestartPossible -= dt;
          if (fc.finalCutscene.timeTillRestartPossible <= 0) {
            fc.finalCutscene.timeTillRestartPossible = 0;
          }
        }
      }
    }

    return false;
  }
}