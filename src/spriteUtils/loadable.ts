export default abstract class Loadable {
  protected ready = true;
  protected readyPromise = Promise.resolve();

  isReady() { return this.ready; }

  whenReady() { return this.readyPromise; }
}