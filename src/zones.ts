type Zone = {x: number; y: number; w: number; h: number;};

// TODOS:
// Make music zones
// - set music zone
// - stop music zone
// Memory issues... :(

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
  angrySun: (Zone & {music?: string;})[];
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