import SpriteWrapper from "../../spriteUtils/sprite-wrapper";
import SpritesheetWrapper from "../../spriteUtils/spritesheet-wrapper";

export default abstract class SpriteWrapperFactory<T extends SpritesheetWrapper<any>, R extends SpriteWrapper> {
  private called = false;
  private loaded = false;
  private promise: Promise<void>;

  protected spritesheet: T;

  constructor(spritesheet: T) {
    this.spritesheet = spritesheet;
    this.promise = this.spritesheet.whenReady();
    if (this.spritesheet.isReady()) {
      this.called = true;
      this.loaded = true;
    } else {
      this.promise.then(() => {
        this.called = true;
        this.loaded = true;
      });
    }
  }

  protected abstract produce(): R;

  new() {
    this.called = true;
    return this.produce();
  }

  getState(): 'ready' | 'loading' | 'standby' {
    if (this.loaded) return 'ready';
    if (this.called) return 'loading';
    return 'standby';
  }

  whenReady() {
    return this.promise;
  }
}