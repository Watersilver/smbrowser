import { Container, Sprite } from "pixi.js";
import { dummyTexture } from "./dummies";
import Loadable from "./loadable";

export default abstract class SpriteWrapper extends Loadable {
  readonly container = new Container();
  readonly sprite: Sprite;

  constructor() {
    super();
    this.sprite = new Sprite(dummyTexture);
    this.container.addChild(this.sprite);
  }
}