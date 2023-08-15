import mario from "./loaders/smb1/mario"
import tiles from "./loaders/smb1/tiles"
import SpriteWrapperIndustrialComplex from "./loaders/spritewrapper-industrial-complex"

const smb1Sprites = new SpriteWrapperIndustrialComplex({
  mario,
  tiles
});

export default smb1Sprites;