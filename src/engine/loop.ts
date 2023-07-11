export default abstract class Loop {
  private deltaTime = 0;

  get dt() { return this.deltaTime; }

  // Intervals and timeouts and rafs must be set in a method.
  // if set in the constructor `this` will be bound
  // to an instance of this class instead of the extended
  // one and it will be unable to see extended object's fields.
  // JS context nonsense.
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onStart();
    if (this.onFrameDraw !== Loop.prototype.onFrameDraw) this.rafCallback(0);
  }

  protected onStart(){}
  protected onStop(){}

  protected onFrameDraw(){}

  private frame: number | undefined = undefined;
  private prevRafTimestamp = 0;
  private rafCallback(timestamp: number = 0) {
    const dtMS = timestamp - this.prevRafTimestamp;

    this.prevRafTimestamp = timestamp;

    // Cap dt to avoid weirdness
    this.deltaTime = Math.min(500, dtMS) * 0.001;

    this.onFrameDraw();

    if (this.isRunning) this.frame = requestAnimationFrame(timestamp => this.rafCallback(timestamp));
  }

  private isRunning = false;
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.onStop();
  }

  isStopped() {return !this.isRunning;}
}
