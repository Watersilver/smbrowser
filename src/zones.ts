type Zone = {x: number; y: number; w: number; h: number;};

// TODO:
// Worlds:

// TODO: lavabubbles
// TODO: shaders for flower && star
// TODO: bg zones implementation
// TODO: music zones?
// TODO: checkpoints
// TODO: reset fallen platforms
// TODO: level end

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
  unload: Zone[];
  darkbg: Zone[];
  checkpoint: Zone[];
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
  unload: [],
  darkbg: [],
  checkpoint: []
};

export default zones;