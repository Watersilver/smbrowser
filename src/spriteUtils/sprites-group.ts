import { Resource, Texture } from "pixi.js";
import SpriteWrapper from "./sprite-wrapper";
import SpritesheetWrapper from "./spritesheet-wrapper";

export default class SpritesGroup<T extends {[frame: string]: Texture<Resource>} = any> extends SpriteWrapper {
  private readonly textures: T;
  private frame: keyof T;
  private anchors: Map<keyof T, {x: number, y: number}> = new Map();

  static from<T extends {
    frames: {readonly [frame in string]: {x:number,y:number,w:number,h:number}}
  }, F extends keyof T['frames']>(
    sw: SpritesheetWrapper<T>,
    frames: F[],
    init: F
  ) {
    const textures: {
      [key in F]: Texture<Resource>;
    } = {} as any;

    if (sw.isReady()) {
      frames.forEach(a => textures[a] = sw.getFrame(a));
      return new SpritesGroup(textures, init);
    } else {
      const sg = new SpritesGroup(textures, init);
      sg.ready = false;
      sg.readyPromise = sw.parse().then(() => {
        frames.forEach(a => textures[a] = sw.getFrame(a));
        sg.load(textures);
        sg.ready = true;
      });
      return sg;
    }
  }

  private load(textures: T) {
    for (const [k, v] of Object.entries(textures)) {
      (this.textures as any)[k] = v;
    }
    // Force texture refresh by changing current frame to an invalid one
    this.forceSetFrame(this.frame);
  }

  constructor(textures: T, init: keyof T) {
    super();
    this.textures = textures;
    this.frame = init;
    this.forceSetFrame(this.frame);
  }

  setFrameAnchor(frame: keyof T, anchor: {x: number, y: number}) {
    this.anchors.set(frame, anchor);
  }

  private forceSetFrame(frame: keyof T) {
    // Force texture refresh by changing current frame to an invalid/different one
    this.frame = frame.toString() + "s";
    this.setFrame(frame);
  }

  /**
   * @param frame new frame name
   * @returns true if texture was updated, false otherwise
   */
  setFrame(frame: keyof T) {
    if (this.frame === frame) return false;
    const a = this.anchors.get(frame);
    if (a) {
      this.sprite.anchor.set(a.x, a.y);
    } else {
      this.sprite.anchor.set(0.5);
    }
    this.frame = frame;
    const t = this.textures[frame];
    if (t) {
      this.sprite.texture = t;
      return true;
    }
    return false;
  }

  getFrame() {
    return this.frame;
  }

  getFrames() {
    return Object.keys(this.textures) as (keyof T)[];
  }
}