import { UnwrapLazyLoader } from "../spriteUtils/lazy-loader"
import marioLoader from "./loaders/smb1/mario"

export type Smb1MarioSprites = UnwrapLazyLoader<typeof marioLoader>;

let loadCalled = false;
let marioLoaded = false;
let readyResolve = () => {};
const marioPromise = new Promise<void>(res => readyResolve = res);
marioLoader.whenReady().then(() => {
  marioLoaded = true;
  readyResolve();
});

// Filters:
// https://filters.pixijs.download/main/docs/index.html
// https://github.com/pixijs/pixijs/wiki/v4-Creating-Filters
// https://pixijs.download/dev/docs/PIXI.Filter.html
// https://www.youtube.com/watch?v=wIC-CqsUplw
export const smb1Sprites = {
  async loadAll() {
    if (loadCalled) return;
    loadCalled = true;
    marioLoader.get();
  },

  getMario() {
    return marioLoader.get();
  },

  getLoadingProgress() {
    return marioLoaded ? 1 : 0;
  },

  async whenReady() {
    await Promise.all([marioPromise]);
  }
}