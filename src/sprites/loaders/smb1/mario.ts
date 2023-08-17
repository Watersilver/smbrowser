import AnimationsGroup from "../../../spriteUtils/animations-group";
import SpritesheetWrapper from "../../../spriteUtils/spritesheet-wrapper"
import image from '../../../assets/NES - Super Mario Bros - Mario & Luigi.png'
import SpriteWrapperFactory from "../spritewrapper-factory";

const marioSmb1Json = {
  frames: {
    smallIdle: {x:0,y:8,w:16,h:16},
    bigIdle: {x:0,y:32,w:16,h:32},
    smallWalk1: {x:56,y:8,w:16,h:16},
    smallWalk2: {x:20,y:8,w:16,h:16},
    smallWalk3: {x:38,y:8,w:16,h:16},
    bigWalk1: {x:56,y:32,w:16,h:32},
    bigWalk2: {x:20,y:32,w:16,h:32},
    bigWalk3: {x:38,y:32,w:16,h:32},
    smallSkid: {x:76,y:8,w:16,h:16},
    bigSkid: {x:76,y:32,w:16,h:32},
    smallJump: {x:96,y:8,w:16,h:16},
    bigJump: {x:96,y:32,w:16,h:32},
    smallDie: {x:116,y:8,w:16,h:16},
    bigDuck: {x:116,y:42,w:16,h:22},
    smallClimb1: {x:136,y:8,w:16,h:16},
    smallClimb2: {x:154,y:8,w:16,h:16},
    bigClimb1: {x:136,y:32,w:16,h:32},
    bigClimb2: {x:154,y:32,w:16,h:32},
    smallSwim1: {x:174,y:8,w:16,h:16},
    smallSwim2: {x:192,y:8,w:16,h:16},
    smallSwim3: {x:210,y:8,w:16,h:16},
    smallSwim4: {x:228,y:8,w:16,h:16},
    smallSwim5: {x:246,y:8,w:16,h:16},
    smallSwim6: {x:264,y:8,w:16,h:16},
    bigSwim1: {x:174,y:32,w:16,h:32},
    bigSwim2: {x:192,y:32,w:16,h:32},
    bigSwim3: {x:210,y:32,w:16,h:32},
    bigSwim4: {x:228,y:32,w:16,h:32},
    bigSwim5: {x:246,y:32,w:16,h:32},
    bigSwim6: {x:264,y:32,w:16,h:32},
    bigShootIdle: {x:136,y:72,w:16,h:32},
    bigShootWalk1: {x:190,y:72,w:16,h:32},
    bigShootWalk2: {x:154,y:72,w:16,h:32},
    bigShootWalk3: {x:172,y:72,w:16,h:32},
    bigShootSkid: {x:208,y:72,w:16,h:32},
    bigShootJump: {x:244,y:72,w:16,h:32}
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

  transparency: [
    {r: {from: 0.57, to: 0.58}, g: {from: 0.56, to: 0.57}, b: {from: 0.99, to: 1}},
    {r: {from: 0, to: 0.01}, g: {from: 0.16, to: 0.17}, b: {from: 0.54, to: 0.55}}
  ]
} as const;

const mSS = new SpritesheetWrapper(image, marioSmb1Json);

export type Smb1MarioSprites = AnimationsGroup<{readonly [animation in typeof mSS['animations'][number]]: any}>;

class Smb1MarioFactory extends SpriteWrapperFactory<typeof mSS, Smb1MarioSprites> {
  protected override produce() {
    const marioSprites = AnimationsGroup.from(
      mSS,
      mSS.getAnimations(),
      'smallIdle'
    );
    marioSprites.setAnimationAnchor('smallJump', {x: 0.5, y: 0.55});
    marioSprites.setAnimationAnchor('bigJump', {x: 0.5, y: 0.57});
    marioSprites.setAnimationAnchor('bigShootJump', {x: 0.5, y: 0.57});
    marioSprites.setAnimationAnchor('bigDuck', {x: 0.5, y: 0.62});
    marioSprites.container.zIndex = 1;
    return marioSprites;
  }
}

const smb1marioFactory = new Smb1MarioFactory(mSS);

export default smb1marioFactory;