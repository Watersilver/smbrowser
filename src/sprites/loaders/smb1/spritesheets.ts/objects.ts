import image from '../../../../assets/objects.png'
import SpritesheetWrapper from "../../../../spriteUtils/spritesheet-wrapper";

const objectsSmb1Json = {
  frames: {
    mushroom: {x:0,y:8,w:16,h:16},
    oneup: {x:0,y:26,w:16,h:16},
    flower: {x:68,y:8,w:16,h:16},
    star: {x:142,y:8,w:16,h:16},
    coin1: {x:180,y:36,w:8,h:16},
    coin2: {x:190,y:36,w:8,h:16},
    coin3: {x:200,y:36,w:8,h:16},
    coin4: {x:210,y:36,w:8,h:16},
    fireball1: {x:180,y:54,w:8,h:8},
    fireball2: {x:190,y:54,w:8,h:8},
    fireball3: {x:200,y:54,w:8,h:8},
    fireball4: {x:210,y:54,w:8,h:8},
    firework1: {x:180,y:64,w:16,h:16},
    firework2: {x:198,y:64,w:16,h:16},
    firework3: {x:216,y:64,w:16,h:16},
    platformTiny: {x:32,y:64,w:16,h:8},
    platformSmall: {x:52,y:64,w:24,h:8},
    platformMedium: {x:80,y:64,w:32,h:8},
    platformBig: {x:116,y:64,w:48,h:8},
    cloudMedium: {x:80,y:74,w:32,h:8},
    cloudBig: {x:116,y:74,w:48,h:8},
    spring1: {x:24,y:75,w:16,h:31},
    spring2: {x:42,y:75,w:16,h:31},
    spring3: {x:60,y:75,w:16,h:31},
    starflag: {x:110,y:90,w:16,h:16},
    evilflag: {x:92,y:90,w:16,h:16},
    vinetop: {x:130,y:90,w:16,h:16},
    vine: {x:148,y:90,w:16,h:16}
  },

  animations: {
    fireball: ['fireball1', 'fireball2', 'fireball3', 'fireball4'],
    firework: ['firework1', 'firework2', 'firework3'],
    spring: ['spring1', 'spring2', 'spring3'],
    coin: ['coin1', 'coin2', 'coin3', 'coin4']
  },

  transparency: [
    {r: {from: 0.57, to: 0.581}, g: {from: 0.56, to: 0.57}, b: {from: 0.99, to: 1}},
    {r: {from: 0, to: 0.01}, g: {from: 0.16, to: 0.17}, b: {from: 0.54, to: 0.55}}
  ]
} as const;

const smb1ObjectsSpritesheet = new SpritesheetWrapper(image, objectsSmb1Json);
export default smb1ObjectsSpritesheet;