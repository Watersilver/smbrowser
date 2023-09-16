import mario from "./loaders/smb1/mario"
import tiles from "./loaders/smb1/tiles"
import animTiles from "./loaders/smb1/animated-tiles"
import objects from "./loaders/smb1/objects"
import animObjects from "./loaders/smb1/animated-objects"
import enemies from "./loaders/smb1/enemies"
import SpriteWrapperIndustrialComplex from "./loaders/spritewrapper-industrial-complex"

const smb1Sprites = new SpriteWrapperIndustrialComplex({
  mario,
  tiles,
  animTiles,
  objects,
  animObjects,
  enemies
});

export default smb1Sprites;