type Zone = {x: number; y: number; w: number; h: number;};

const zones: {
  camera: Zone[],
  preserveCamera: Zone[],
  death: Zone[],
  whirlpool: Zone[],
  underwater: Zone[],
  surface: Zone[],
  noInput: Zone[]
} = {
  camera: [],
  preserveCamera: [],
  death: [],
  whirlpool: [],
  underwater: [],
  surface: [],
  noInput: []
};

export default zones;