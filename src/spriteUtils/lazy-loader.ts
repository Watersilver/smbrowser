import Loadable from "./loadable";

export type UnwrapLazyLoader<T> = T extends LazyLoader<infer X> ? X : never;

export class LazyLoader<T extends Loadable> extends Loadable {
  private loader: () => T;
  private cache?: T;
  private readyResolve?: () => void;
  constructor(loader: () => T) {
    super();
    this.ready = false;
    this.readyPromise = new Promise<void>(res => this.readyResolve = res);
    this.loader = loader;
  }

  get() {
    if (this.cache) return this.cache;
    const t = this.loader();
    this.cache = t;
    t.whenReady().then(() => {
      this.readyResolve?.();
      this.ready = true;
    });
    return t;
  }
}