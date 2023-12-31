import { Assets, Filter, ISpritesheetData, RenderTexture, Sprite, Spritesheet, Texture, utils } from "pixi.js";
import display from "../display";
import { dummyTexture, dummyTextures } from "./dummies";
import Loadable from "./loadable";

type ColorRange = {readonly from: number; readonly to: number;};
type RGBRange = {readonly r: ColorRange; readonly g: ColorRange; readonly b: ColorRange};

/** Convert all numbers to float notation for shader code */
function s(n: number) {
  const s = n.toString();
  if (!s.includes('.')) return s + ".0";
  return s;
}

export default class SpritesheetWrapper<T extends {
  frames: {readonly [frame in string]: {x:number,y:number,w:number,h:number}}
  animations?: {readonly [animation in string]: readonly (keyof T['frames'])[]}
  transparency?: readonly RGBRange[]
}> extends Loadable {
  private src: string;
  private json: ISpritesheetData;
  private filters?: Filter[];
  private sheet?: Spritesheet;
  private readonly animations: (keyof NonNullable<T['animations']>)[];
  private readonly frames: (keyof NonNullable<T['frames']>)[];
  private texture?: Texture;
  private renderTexture?: RenderTexture;
  private transparency?: readonly RGBRange[];
  private transparencyCache: WeakMap<readonly RGBRange[], Filter> = new WeakMap();
  private resolveReady: () => void = () => {};

  constructor(
    src: string,
    json: T,
    filters?: Filter[]
  ) {
    super();
    this.ready = false;
    this.readyPromise = new Promise<void>(res => {this.resolveReady = res});
    this.src = src;
    this.json = {frames: {}, meta: {scale: "1"}};
    for (const [frame, position] of Object.entries(json.frames)) {
      this.json.frames[frame] = {frame: position};
    }

    this.frames = [...Object.keys(json.frames ?? {})];
    this.animations = [...Object.keys(json.animations ?? {})];

    if (json.animations) {
      this.json.animations = {};
      for (const [animation, frames] of Object.entries(json.animations)) {
        const a: string[] = [];
        this.json.animations[animation] = a;
        frames.forEach(frame => {if (typeof frame === 'string') a.push(frame)});
      }
    }
    this.transparency = json.transparency;
    this.setFilters(filters);
  }

  private setFilters(filters?: Filter[]) {
    if (this.transparency) {
      let transparencyFilter: Filter | undefined = undefined;
      transparencyFilter = this.transparencyCache.get(this.transparency);
      if (!transparencyFilter) {
        const transCondition = this.transparency.map(t => `(c.x >= ${s(t.r.from)} && c.x <= ${s(t.r.to)} && c.y >= ${s(t.g.from)} && c.y <= ${s(t.g.to)} && c.z >= ${s(t.b.from)} && c.z <= ${s(t.b.to)})`).join("||");
        transparencyFilter = new Filter(undefined, `
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        void main(void)
        {
          vec4 c = texture2D(uSampler, vTextureCoord);
          if (
            ${transCondition}
          ) {
            gl_FragColor = vec4(0.0,0.0,0.0,0.0);
          } else {
            gl_FragColor = c;
          }
        }
        `);
      }
      if (transparencyFilter) this.filters = [transparencyFilter, ...(filters ?? [])];
    } else {
      this.filters = filters;
    }
  }

  private unparsed = true;
  async parse() {
    if (this.ready) return;
    if (!this.unparsed) return await this.readyPromise;
    this.unparsed = false;

    // Load base image
    const texture = await Assets.load(this.src);
    if (!(texture instanceof Texture)) {
      throw Error("Src was not pointing to a texture.");
    }

    // Create render texture
    const renderTexture = RenderTexture.create({
      width: texture.width,
      height: texture.height
    });
    const s = Sprite.from(texture);
    if (this.filters?.length) s.filters = this.filters;

    // Render filtered image to render texture
    display.renderer.render(s, {renderTexture});

    this.texture = texture;
    this.renderTexture = renderTexture;

    // Create spritesheet using render texture
    this.sheet = new Spritesheet(renderTexture, this.json);
    
    utils.clearTextureCache();
    await this.sheet.parse();
    utils.clearTextureCache();

    // Pad the textures to avoid webgl bullcrap seams.
    // Example of the problem https://www.html5gamedevs.com/topic/45418-what-to-do-about-edges-between-tiles/
    for (const [k, t] of Object.entries(this.sheet.textures)) {
      const paddedTexture = RenderTexture.create({
        width: t.width + 2,
        height: t.height + 2
      });

      const spr = Sprite.from(t);

      const fx = t.frame.x;
      const fy = t.frame.y;
      const fw = t.frame.width;
      const fh = t.frame.height;

      // Pad left
      t.frame.x = fx;
      t.frame.y = fy;
      t.frame.width = 1;
      t.frame.height = fh;
      t.updateUvs();
      spr.position.x = 0;
      // spr.position.y = 0;
      // display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});
      // spr.position.y = 2;
      // display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});
      spr.position.y = 1;
      display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});

      // Pad right
      t.frame.x = fx + fw - 1;
      t.frame.y = fy;
      t.frame.width = 1;
      t.frame.height = fh;
      t.updateUvs();
      spr.position.x = fw + 1;
      // spr.position.y = 0;
      // display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});
      // spr.position.y = 2;
      // display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});
      spr.position.y = 1;
      display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});

      // Pad top
      t.frame.x = fx;
      t.frame.y = fy;
      t.frame.width = fw;
      t.frame.height = 1;
      t.updateUvs();
      spr.position.y = 0;
      // spr.position.x = 0;
      // display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});
      // spr.position.x = 2;
      // display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});
      spr.position.x = 1;
      display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});

      // Pad bottom
      t.frame.x = fx;
      t.frame.y = fy + fh - 1;
      t.frame.width = fw;
      t.frame.height = 1;
      t.updateUvs();
      spr.position.y = fh + 1;
      // spr.position.x = 0;
      // display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});
      // spr.position.x = 2;
      // display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});
      spr.position.x = 1;
      display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});

      // Draw center
      t.frame.x = fx;
      t.frame.y = fy;
      t.frame.width = fw;
      t.frame.height = fh;
      t.updateUvs();
      spr.position.x = 1;
      spr.position.y = 1;
      display.renderer.render(spr, {renderTexture: paddedTexture, clear: false});

      paddedTexture.frame.x = 1;
      paddedTexture.frame.y = 1;
      paddedTexture.frame.width = t.width;
      paddedTexture.frame.height = t.height;
      paddedTexture.updateUvs();
      this.sheet.textures[k] = paddedTexture;
    }

    // Replace animations textures with padded textures
    for (const anim of Object.values(this.sheet.animations)) {
      for (let i = 0; i != anim.length; i++) {
        const a = anim[i]?.textureCacheIds[0];
        const t = a && this.sheet.textures[a];
        if (t) anim[i] = t;
      }
    }

    this.ready = true;
    this.resolveReady();
  }

  modifyTexture(f: Filter[]) {
    if (!this.texture || !this.renderTexture) return;
    const s = Sprite.from(this.texture);
    this.filters = f;
    s.filters = this.filters;
    display.renderer.render(s, {renderTexture: this.renderTexture, clear: true});
  }

  getFrame(frame: keyof T['frames']) {
    return this.sheet?.textures[frame as string] ?? dummyTexture;
  }

  getAnimation(animation: keyof NonNullable<T['animations']>) {
    return this.sheet?.animations[animation as string] ?? dummyTextures;
  }

  getAnimations() {
    return [...this.animations];
  }

  getFrames() {
    return [...this.frames];
  }
}
