import { UnwrapLazyLoader } from "../spriteUtils/lazy-loader"
import marioFactory from "./loaders/smb1/mario"
import newTilesLoader from "./loaders/smb1/tiles"

export type Smb1Tiles = UnwrapLazyLoader<ReturnType<typeof newTilesLoader>>;

let loadCalled = false;

let newTilesCalled = false;
let tilesLoaded = false;
let tilesReadyResolve = () => {};
const tilesPromise = new Promise<void>(res => tilesReadyResolve = res);

// Filters:
// https://filters.pixijs.download/main/docs/index.html
// https://github.com/pixijs/pixijs/wiki/v4-Creating-Filters
// https://pixijs.download/dev/docs/PIXI.Filter.html
// https://www.youtube.com/watch?v=wIC-CqsUplw
export const smb1Sprites = {
  async loadAll() {
    if (loadCalled) return;
    loadCalled = true;
    if (marioFactory.getState() === 'standby') {
      marioFactory.new();
    }
  },

  newTile() {
    const tileLoader = newTilesLoader();
    if (!(newTilesCalled || loadCalled)) tileLoader.whenReady().then(() => {
      tilesLoaded = true;
      tilesReadyResolve();
    });
    newTilesCalled = true;
    return tileLoader.get();
  },

  newMario() {
    return marioFactory.new();
  },

  getLoadingProgress() {
    return marioFactory.getState() === "ready" ? 1 : 0;
  },

  async whenReady() {
    await Promise.all([marioFactory.whenReady(), tilesPromise]);
  }
}