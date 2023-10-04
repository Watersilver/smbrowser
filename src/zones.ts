type Zone = {x: number; y: number; w: number; h: number;};

// TODO:
// Worlds:

// 4 plain easy: 1-1 done, 2-1 done, 3-1 done, 3-2 done
// 2 underground: 1-2, 4-2
// 2 mushrooms: 1-3, 4-3
// 1 lakitu: 4-1
// 2 plain medium: 5-1, 5-2
// 3 castle easy: 1-4, 2-4, 3-4

// 1 lakitu: 6-1
// 1 plain medium: 6-2
// 2 mushrooms: 3-3, 6-3
// 1 plain hard: 7-1
// 1 underwater: 2-2
// 2 flying fish: 2-3 connect with 7-3 (7-3 should be night to be less boring)
// 1 plain hard: 8-1
// 1 lakitu: 8-2
// 1 plain hard: 8-3
// 3 castle hard: 4-4, 7-4, 8-4

// TODO: shaders for flower && star
// TODO: bg zones implementation
// TODO: music zones?
// TODO: checkpoints
// TODO: reset fallen platforms
// TODO: level end
// TODO: npc

const zones: {
  camera: Zone[];
  preserveCamera: Zone[];
  death: Zone[];
  whirlpool: Zone[];
  underwater: Zone[];
  surface: Zone[];
  noInput: Zone[];
  jumpCheep: Zone[];
  cheep: Zone[];
  lakitu: Zone[];
  bill: Zone[];
  fire: Zone[];
  angrySun: Zone[];
  medusaHead: Zone[];
  mask: Zone[];
  loop: Zone[];
  seabg: Zone[];
  darkbg: Zone[];
} = {
  camera: [],
  preserveCamera: [],
  death: [],
  whirlpool: [],
  underwater: [],
  surface: [],
  noInput: [],
  jumpCheep: [],
  cheep: [],
  lakitu: [],
  bill: [],
  fire: [],
  angrySun: [],
  medusaHead: [],
  mask: [],
  loop: [],
  seabg: [],
  darkbg: []
};

export default zones;