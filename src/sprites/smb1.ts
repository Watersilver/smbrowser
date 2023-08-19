import mario from "./loaders/smb1/mario"
import tiles from "./loaders/smb1/tiles"
import animTiles from "./loaders/smb1/animated-tiles";
import SpriteWrapperIndustrialComplex from "./loaders/spritewrapper-industrial-complex"

const smb1Sprites = new SpriteWrapperIndustrialComplex({
  mario,
  tiles,
  animTiles
});

export default smb1Sprites;