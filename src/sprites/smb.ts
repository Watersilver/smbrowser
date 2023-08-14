import { UnwrapLazyLoader } from "../spriteUtils/lazy-loader"
import newMarioLoader from "./loaders/smb1/mario"

export type Smb1MarioSprites = UnwrapLazyLoader<ReturnType<typeof newMarioLoader>>;

let loadCalled = false;
let newMarioCalled = false;
let marioLoaded = false;
let readyResolve = () => {};
const marioPromise = new Promise<void>(res => readyResolve = res);

// Filters:
// https://filters.pixijs.download/main/docs/index.html
// https://github.com/pixijs/pixijs/wiki/v4-Creating-Filters
// https://pixijs.download/dev/docs/PIXI.Filter.html
// https://www.youtube.com/watch?v=wIC-CqsUplw
export const smb1Sprites = {
  async loadAll() {
    if (loadCalled) return;
    loadCalled = true;
    const marioLoader = newMarioLoader();
    marioLoader.get();
    if (!newMarioCalled) marioLoader.whenReady().then(() => {
      marioLoaded = true;
      readyResolve();
    });
  },

  newMario() {
    const marioLoader = newMarioLoader();
    if (!(newMarioCalled || loadCalled)) marioLoader.whenReady().then(() => {
      marioLoaded = true;
      readyResolve();
    });
    newMarioCalled = true;
    return marioLoader.get();
  },

  getLoadingProgress() {
    return marioLoaded ? 1 : 0;
  },

  async whenReady() {
    await Promise.all([marioPromise]);
  }
}