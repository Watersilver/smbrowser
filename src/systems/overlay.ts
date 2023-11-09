import { Container, Graphics, Text } from "pixi.js";
import { Display } from "../display";
import entities, { Entity } from "../entities";
import { Vec2d } from "../engine";
import { getSmb1Audio } from "../audio";

const audio = getSmb1Audio();

// HOLE EXAMPLE:
// https://pixijs.com/examples/graphics/advanced

export default class Overlay {
  private display: Display;
  private overlay = new Container();
  private fade = new Graphics();
  private pauseText: Text;

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
  }

  private is_destroyed = false;
  destroyed() {return this.is_destroyed;}

  destroy() {
    this.is_destroyed = true;
    this.overlay.removeFromParent();
    this.overlay.destroy();
  }

  update(dt: number, paused: boolean) {
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
    if (paused) {
      this.pauseText.visible = true;
      const v = document.getElementById('volume');
      if (v) v.style.display = "unset";
    } else {
      this.pauseText.visible = false;
    }

    let fc: Entity | null = null;
    for (const e of entities.view(['finalCutscene'])) {
      fc = e;
    }

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
        audio.music.setMusic({name: 'smb3underwater'});
        fc.finalCutscene.creditsState = 2;
      // } else if (fc.finalCutscene.creditsState === 2) {
      }
    }
  }
}