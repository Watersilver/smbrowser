import { BaseTexture, Container, Filter, Resource, Sprite, Spritesheet, Texture, autoDetectRenderer } from "pixi.js"
import image from "./assets/NES - Super Mario Bros - Mario & Luigi.png"

const dummyTex = new Texture(new BaseTexture());

export class Animations<T extends {[animation: string]: Texture<Resource>[]} = any> {
  readonly container = new Container();
  readonly textures: T;
  readonly sprite: Sprite;
  private animation: keyof T;
  private index: number = 0;
  private frames: Texture<Resource>[] = [];
  private looped = false;
  private anchors: Map<keyof T, {x: number, y: number}> = new Map();
  loopsPerSecond: number = 1;

  constructor(textures: T, init: keyof T) {
    this.textures = textures;
    this.sprite = new Sprite(dummyTex);
    this.container.addChild(this.sprite);
    this.animation = init;
    this.setAnimation(init);
  }

  load(textures: T) {
    for (const [k, v] of Object.entries(textures)) {
      (this.textures as any)[k] = v;
    }
    this.setAnimation(this.animation, true);
  }

  setAnimationAnchor(animation: keyof T, anchor: {x: number, y: number}) {
    this.anchors.set(animation, anchor);
  }

  /**
   * @param animation new animation name
   * @param force force texture to be updated even if new animation is same as old
   * @returns true if texture was updated, false otherwise
   */
  setAnimation(animation: keyof T, force?: boolean) {
    if (this.animation === animation && !force) return false;
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
    if (prevIndex !== this.index) this.looped = true;
  }

  didLoop() {
    return this.looped;
  }

  private updateTexture() {
    this.index %= this.frames.length || 1;
    const frame = this.frames[Math.floor(this.index)];
    if (frame) this.sprite.texture = frame;
  }
}

const marioSmb1Json = {
  frames: {
    smallIdle:
    {
      frame: {x:0,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    bigIdle:
    {
      frame: {x:0,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    smallWalk1:
    {
      frame: {x:56,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    smallWalk2:
    {
      frame: {x:20,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    smallWalk3:
    {
      frame: {x:38,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    bigWalk1:
    {
      frame: {x:56,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigWalk2:
    {
      frame: {x:20,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigWalk3:
    {
      frame: {x:38,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    smallSkid:
    {
      frame: {x:76,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    bigSkid:
    {
      frame: {x:76,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    smallJump:
    {
      frame: {x:96,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    bigJump:
    {
      frame: {x:96,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    smallDie:
    {
      frame: {x:116,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    bigDuck:
    {
      frame: {x:116,y:42,w:16,h:22},
      sourceSize: {w:16,h:22},
    },
    smallClimb1:
    {
      frame: {x:136,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    smallClimb2:
    {
      frame: {x:154,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    bigClimb1:
    {
      frame: {x:136,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigClimb2:
    {
      frame: {x:154,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    smallSwim1:
    {
      frame: {x:174,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    smallSwim2:
    {
      frame: {x:192,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    smallSwim3:
    {
      frame: {x:210,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    smallSwim4:
    {
      frame: {x:228,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    smallSwim5:
    {
      frame: {x:246,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    smallSwim6:
    {
      frame: {x:264,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
    },
    bigSwim1:
    {
      frame: {x:174,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigSwim2:
    {
      frame: {x:192,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigSwim3:
    {
      frame: {x:210,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigSwim4:
    {
      frame: {x:228,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigSwim5:
    {
      frame: {x:246,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigSwim6:
    {
      frame: {x:264,y:32,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigShootIdle:
    {
      frame: {x:136,y:72,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigShootWalk1:
    {
      frame: {x:190,y:72,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigShootWalk2:
    {
      frame: {x:154,y:72,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigShootWalk3:
    {
      frame: {x:172,y:72,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigShootSkid:
    {
      frame: {x:208,y:72,w:16,h:32},
      sourceSize: {w:16,h:32},
    },
    bigShootJump:
    {
      frame: {x:244,y:72,w:16,h:32},
      sourceSize: {w:16,h:32},
    }
  },

  animations: {
    smallWalk: ["smallWalk1","smallWalk2","smallWalk3"],
    bigWalk: ["bigWalk1","bigWalk2","bigWalk3"],
    bigShootWalk: ["bigShootWalk1","bigShootWalk2","bigShootWalk3"],
    smallClimb: ["smallClimb1","smallClimb2"],
    bigClimb: ["bigClimb1","bigClimb2"],
    smallSwimStroke: ["smallSwim1","smallSwim2","smallSwim3","smallSwim4","smallSwim5","smallSwim6"],
    bigSwimStroke: ["bigSwim1","bigSwim2","bigSwim3","bigSwim4","bigSwim5","bigSwim6"],
    smallSwim: ["smallSwim1","smallSwim2"],
    bigSwim: ["bigSwim1","bigSwim2"],
    smallIdle: ["smallIdle"],
    bigIdle: ["bigIdle"],
    bigShootIdle: ["bigShootIdle"],
    smallJump: ["smallJump"],
    bigJump: ["bigJump"],
    bigShootJump: ["bigShootJump"],
    smallSkid: ["smallSkid"],
    bigSkid: ["bigSkid"],
    bigShootSkid: ["bigShootSkid"],
    smallDie: ["smallDie"],
    bigDuck: ["bigDuck"]
  },

  meta: {
    image,
    scale: "1"
  }
}


const marioTransparencyFilter = new Filter(undefined, `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
void main(void)
{
  vec4 c = texture2D(uSampler, vTextureCoord);
  if (
    (c.x > 0.57 && c.x < 0.58 && c.y > 0.56 && c.y < 0.57 && c.z > 0.99)
    ||
    (c.x < 0.01 && c.y > 0.16 && c.y < 0.17 && c.z > 0.54 && c.z < 0.55)
  ) {
    gl_FragColor = vec4(0.0,0.0,0.0,0.0);
  } else {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
  }
}
`);

const t = new BaseTexture(image);
const marioSmb1Spritesheet = new Spritesheet(t, marioSmb1Json);

// const renderTexture = RenderTexture.create({
//   width: marioSmb1Spritesheet.baseTexture.width,
//   height: marioSmb1Spritesheet.baseTexture.height
// });
// const s = Sprite.from(marioSmb1Spritesheet.baseTexture);
// s.filters = [marioTransparencyFilter];
// display.renderer.render(s, {renderTexture});

let smb1MarioParsed = false;
async function parseMarioSmb1Spritesheet() {
  await marioSmb1Spritesheet.parse();
  smb1MarioParsed = true;
  return marioSmb1Spritesheet;
}

function createMarioSmb1Sprites(s: Spritesheet) {
  const smallWalk = s.animations['smallWalk'] ?? [];
  const bigWalk = s.animations['bigWalk'] ?? [];
  const bigShootWalk = s.animations['bigShootWalk'] ?? [];
  const smallClimb = s.animations['smallClimb'] ?? [];
  const bigClimb = s.animations['bigClimb'] ?? [];
  const smallSwim = s.animations['smallSwim'] ?? [];
  const bigSwim = s.animations['bigSwim'] ?? [];
  const smallIdle = s.animations['smallIdle'] ?? [];
  const bigIdle = s.animations['bigIdle'] ?? [];
  const bigShootIdle = s.animations['bigShootIdle'] ?? [];
  const smallJump = s.animations['smallJump'] ?? [];
  const bigJump = s.animations['bigJump'] ?? [];
  const bigShootJump = s.animations['bigShootJump'] ?? [];
  const smallSkid = s.animations['smallSkid'] ?? [];
  const bigSkid = s.animations['bigSkid'] ?? [];
  const bigShootSkid = s.animations['bigShootSkid'] ?? [];
  const smallDie = s.animations['smallDie'] ?? [];
  const bigDuck = s.animations['bigDuck'] ?? [];
  const smallSwimStroke = s.animations['smallSwimStroke'] ?? [];
  const bigSwimStroke = s.animations['bigSwimStroke'] ?? [];

  const marioSprites = new Animations({
    smallWalk,
    bigWalk,
    smallClimb,
    smallSwim,
    smallIdle,
    smallJump,
    bigJump,
    smallSkid,
    smallDie,
    smallSwimStroke,
    bigIdle,
    bigSkid,
    bigDuck,
    bigClimb,
    bigSwim,
    bigSwimStroke,
    bigShootWalk,
    bigShootIdle,
    bigShootJump,
    bigShootSkid
  }, 'smallIdle');
  marioSprites.setAnimationAnchor('bigJump', {x: 0.5, y: 0.57});
  marioSprites.setAnimationAnchor('bigShootJump', {x: 0.5, y: 0.57});
  marioSprites.setAnimationAnchor('bigDuck', {x: 0.5, y: 0.62});

  // marioSprites.container.filters = [marioTransparencyFilter];

  return marioSprites;
}

// underwater filter: displacement
// https://filters.pixijs.download/main/docs/index.html

export function getMarioSmb1Sprites() {
  const a = createMarioSmb1Sprites(marioSmb1Spritesheet);
  if (!smb1MarioParsed) parseMarioSmb1Spritesheet().then(v => {
    a.load(v.animations as any);
  });
  return a;
}