import { Container, Sprite } from "pixi.js";
import { dummyTexture } from "./dummies";
import Loadable from "./loadable";
import display from "../display";

export default abstract class SpriteWrapper extends Loadable {
  readonly container = new Container();
  readonly sprite: Sprite;

  constructor() {
    super();
    this.container.cullable = true;
    this.sprite = new Sprite(dummyTexture);
    this.container.addChild(this.sprite);
  }

  private durlCache: Map<any, string> = new Map();
  getDataUrl() {
    const chached = this.durlCache.get(this.sprite.texture);
    if (chached) return chached;
    const durl = display.renderer.extract.canvas(this.sprite).toDataURL?.();
    if (durl) this.durlCache.set(this.sprite.texture, durl);
    return durl;
  }
}