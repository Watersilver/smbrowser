import { BaseTexture, Container, Filter, Resource, Sprite, Spritesheet, Texture } from "pixi.js"
import image from "./assets/NES - Super Mario Bros - Mario & Luigi.png"

const dummyTex = new Texture(new BaseTexture());

export class Animations<T extends {[animation: string]: Texture<Resource>[]} = any> {
  readonly container = new Container();
  readonly textures: T;
  readonly sprite: Sprite;
  private animation: keyof T;
  private index: number = 0;
  private frames: Texture<Resource>[] = [];
  loopsPerSecond: number = 1;

  constructor(textures: T, init: keyof T) {
    this.textures = textures;
    this.sprite = new Sprite(dummyTex);
    this.sprite.anchor.set(0.5);
    this.animation = init;
    this.setAnimation(init);
  }

  load(textures: T) {
    for (const [k, v] of Object.entries(textures)) {
      (this.textures as any)[k] = v;
    }
    this.setAnimation(this.animation);
  }

  setAnimation(animation: keyof T) {
    this.frames = this.textures[animation] ?? [];
    this.animation = animation;
    this.updateTexture();
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

  getFramesPerSecond() {
    return this.loopsPerSecond * this.frames.length;
  }

  update(dt: number) {
    this.index += dt * this.getFramesPerSecond();
    this.updateTexture();
  }

  private updateTexture() {
    this.index %= this.frames.length;
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
      anchor: {x:8,y:8}
    },
    smallWalk1:
    {
      frame: {x:20,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallWalk2:
    {
      frame: {x:38,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallWalk3:
    {
      frame: {x:56,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallSkid:
    {
      frame: {x:76,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallJump:
    {
      frame: {x:96,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallDie:
    {
      frame: {x:116,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallClimb1:
    {
      frame: {x:136,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallClimb2:
    {
      frame: {x:154,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallSwim1:
    {
      frame: {x:174,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallSwim2:
    {
      frame: {x:192,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallSwim3:
    {
      frame: {x:210,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallSwim4:
    {
      frame: {x:228,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
    smallSwim5:
    {
      frame: {x:246,y:8,w:16,h:16},
      sourceSize: {w:16,h:16},
      anchor: {x:8,y:8}
    },
  },

  animations: {
    smallWalk: ["smallWalk1","smallWalk2","smallWalk3"],
    smallClimb: ["smallClimb1","smallClimb2"],
    smallSwim: ["smallSwim1","smallSwim2","smallSwim3","smallSwim4","smallSwim5"],
    smallIdle: ["smallIdle"],
    smallJump: ["smallJump"],
    smallSkid: ["smallSkid"],
    smallDie: ["smallDie"]
  },

  meta: {
    image,
    scale: "1"
  }
}

const t = new BaseTexture(image);
const marioSmb1Spritesheet = new Spritesheet(t, marioSmb1Json);

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

let smb1MarioParsed = false;
async function parseMarioSmb1Spritesheet() {
  await marioSmb1Spritesheet.parse();
  smb1MarioParsed = true;
  return marioSmb1Spritesheet;
}

function createMarioSmb1Sprites(s: Spritesheet) {
  const smallWalk = s.animations['smallWalk'] ?? [];
  const smallClimb = s.animations['smallClimb'] ?? [];
  const smallSwim = s.animations['smallSwim'] ?? [];
  const smallIdle = s.animations['smallIdle'] ?? [];
  const smallJump = s.animations['smallJump'] ?? [];
  const smallSkid = s.animations['smallSkid'] ?? [];
  const smallDie = s.animations['smallDie'] ?? [];

  const marioSprites = new Animations({
    smallWalk,
    smallClimb,
    smallSwim,
    smallIdle,
    smallJump,
    smallSkid,
    smallDie
  }, 'smallIdle');

  marioSprites.container.filters = [marioTransparencyFilter];

  return marioSprites;
}

export function getMarioSmb1Sprites() {
  // parseMarioSmb1Spritesheet();
  return createMarioSmb1Sprites(marioSmb1Spritesheet);
}