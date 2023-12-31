import { Resource, Texture } from "pixi.js";
import SpriteWrapper from "./sprite-wrapper";
import SpritesheetWrapper from "./spritesheet-wrapper";

export default class AnimationsGroup<T extends {[animation: string]: Texture<Resource>[]} = any> extends SpriteWrapper {
  private readonly textures: T;
  private animation: keyof T;
  private index: number = 0;
  private frames: Texture<Resource>[] = [];
  private looped = false;
  private anchors: Map<keyof T, {x: number, y: number}> = new Map();
  loopsPerSecond: number = 1;

  static from<T extends {
    frames: {readonly [frame in string]: {x:number,y:number,w:number,h:number}}
    animations?: {readonly [animation in string]: readonly (keyof T['frames'])[]}
  }, A extends keyof T['animations']>(
    sw: SpritesheetWrapper<T>,
    animations: A[],
    init: A
  ) {
    const anims: {
      [key in A]: Texture<Resource>[];
    } = {} as any;

    if (sw.isReady()) {
      animations.forEach(a => anims[a] = sw.getAnimation(a));
      return new AnimationsGroup(anims, init);
    } else {
      const ag = new AnimationsGroup(anims, init);
      ag.ready = false;
      ag.readyPromise = sw.parse().then(() => {
        animations.forEach(a => anims[a] = sw.getAnimation(a));
        ag.load(anims);
        ag.ready = true;
      });
      return ag;
    }
  }

  private load(textures: T) {
    for (const [k, v] of Object.entries(textures)) {
      (this.textures as any)[k] = v;
    }
    this.forceSetAnimation(this.animation);
  }

  constructor(textures: T, init: keyof T) {
    super();
    this.textures = textures;
    this.animation = init;
    this.forceSetAnimation(this.animation);
  }

  setAnimationAnchor(animation: keyof T, anchor: {x: number, y: number}) {
    this.anchors.set(animation, anchor);
  }

  private forceSetAnimation(animation: keyof T) {
    // Force animation to refresh by changing current animation to an invalid one
    this.animation = animation.toString() + "s";
    this.setAnimation(animation);
  }

  /**
   * @param animation new animation name
   * @returns true if texture was updated, false otherwise
   */
  setAnimation(animation: keyof T) {
    if (this.animation === animation) return false;
    const a = this.anchors.get(animation);
    if (a) {
      this.sprite.anchor.set(a.x, a.y);
    } else {
      this.sprite.anchor.set(0.5);
    }
    this.frames = this.textures[animation] ?? [];
    this.animation = animation;
    this.updateTexture();
    return true;
  }

  getAnimation() {
    return this.animation;
  }

  getAnimations() {
    return Object.keys(this.textures) as (keyof T)[];
  }

  /**
   * @param progress 0-1
   */
  setProgress(progress: number) {
    this.index = Math.floor(progress * this.frames.length);
    this.updateTexture();
  }

  getFrames() {
    return this.frames.length;
  }

  setFrame(newFrame: number) {
    this.index = newFrame;
    this.updateTexture();
  }

  getFrame() {
    return Math.floor(this.index);
  }

  getFramesPerSecond() {
    return this.loopsPerSecond * this.frames.length;
  }

  setFramesPerSecond(fps: number) {
    if (this.frames.length) this.loopsPerSecond = fps / this.frames.length;
  }

  update(dt: number) {
    this.looped = false;
    this.index += dt * this.getFramesPerSecond();
    const prevIndex = this.index;
    this.updateTexture();
    if (Math.abs(prevIndex - this.index) > 0.001) this.looped = true;
  }

  didLoop() {
    return this.looped;
  }

  private updateTexture() {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder#description
    // To obtain a modulo in JavaScript, in place of n % d, use ((n % d) + d) % d.
    // this.index %= this.frames.length || 1;
    const d = this.frames.length || 1;
    this.index = ((this.index % d) + d) % d;
    const frame = this.frames[Math.floor(this.index)];
    if (frame) this.sprite.texture = frame;
  }
}