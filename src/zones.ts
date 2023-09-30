type Zone = {x: number; y: number; w: number; h: number;};

// TODO: remember
// World 1-3 and World 5-3 are the same
// World 1-4 and World 6-4 are the same
// World 2-2 and World 7-2 are the same
// World 2-3 and World 7-3 are the same
// World 2-4 and World 5-4 are the same

// TODO: bg zones implementation
// TODO: music zones?
// TODO: checkpoints
// TODO: reset fallen platforms

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