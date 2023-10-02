type Zone = {x: number; y: number; w: number; h: number;};

// TODO:
// Worlds:
// 1-1 done
// 1-2 done
// 1-3 done
// 1-4
// 2-1
// 2-2
// 2-3
// 2-4
// 3-1
// 3-2
// 3-3
// 3-4
// 4-1
// 4-2
// 4-3
// 4-4
// 5-1
// 5-2
// 5-3 / same as 1-3
// 5-4 / same as 2-4
// 6-1
// 6-2
// 6-3
// 6-4 / same as 1-4
// 7-1
// 7-2 / same as 2-2
// 7-3 / same as 2-3
// 7-4
// 8-1
// 8-2
// 8-3
// 8-4

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