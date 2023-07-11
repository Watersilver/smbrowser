import { BaseTexture, Spritesheet } from "pixi.js"
import image from "./NES - Super Mario Bros - Mario & Luigi.png"

const sheet = {
  frames: {
    smallIdle:
    {
      frame: {x:0,y:8,w:16,h:16},
      // spriteSourceSize: {x:0,y:0,w:16,h:16},
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
    smallSlide:
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
    smallSwim: ["smallSwim1","smallSwim2","smallSwim3","smallSwim4","smallSwim5"]
  },

  meta: {
    image,
    // format: "RGBA8888",
    // size: {w:136, h:102},
    scale: "1"
  }
}

const t = new BaseTexture(image);
const playerSpritesheet = new Spritesheet(t, sheet);

export default async function loadPlayerSpritesheet(): Promise<[Spritesheet, Awaited<ReturnType<Spritesheet['parse']>>]> {
  const parseResult = await playerSpritesheet.parse();
  return [playerSpritesheet, parseResult];
}