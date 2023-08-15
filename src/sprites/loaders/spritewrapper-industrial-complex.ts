import SpriteWrapperFactory from "./spritewrapper-factory";

export default class SpriteWrapperIndustrialComplex<F extends {[factory: string]: SpriteWrapperFactory<any, any>}> {
  private factories: F;
  private promise: Promise<void>;
  constructor(factories: F) {
    this.factories = factories;
    this.promise = Promise.all(Object.values(factories).map(f => f.whenReady())).then();
  }

  getFactory<T extends keyof F>(factory: T) {
    return this.factories[factory];
  }

  whenReady() {
    return this.promise;
  }

  getProgress() {
    const factoryList = Object.values(this.factories);
    return factoryList.filter(fl => fl.getState() === 'ready').length / factoryList.length;
  }
}