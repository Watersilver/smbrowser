type MusicInput<T extends string> = {
  fadeOutPrev?: number;
  fadeIn?: number;
  silence?: number;
  name?: T | null;
  loopStart?: number;
  loopEnd?: number;
}

function connectNodes(first: AudioNode, ...nodes: AudioNode[]) {
  let current = first;
  for (const next of nodes) {
    current = current.connect(next);
  }
  return current;
}

abstract class AudioLoader<T extends string> {
  protected loadingProgress = 1;
  protected loading: Promise<void>;
  protected loaded: {[src in T]?: AudioBuffer} = {};
  constructor(context: AudioContext, srcs: {[name in T]: string}) {
    this.loadingProgress = 0;
    const srcReqs: Promise<[T, AudioBuffer]>[] = [];
    for (const key of Object.keys(srcs)) {
      const src = srcs[key as T];
      srcReqs.push(
        fetch(src)
        .then(res => {
          if (!res.ok) throw Error(src + " preload failed.");
          return res.arrayBuffer();
        })
        .then(arr => context.decodeAudioData(arr))
        .then(aud => {
          this.loadingProgress += 1/srcReqs.length;
          return [key as T, aud];
        })
      );
    }
    this.loading = Promise.all(srcReqs).then(rawlist => {
      this.loadingProgress = 1;
      for (const [key, buffer] of rawlist) {
        this.loaded[key] = buffer;
      }
    });
  }

  /**
   * @returns 0 - 1
   */
  getloadingProgress() {
    return this.loadingProgress;
  }

  /** Promise that resolves when loading is done and rejects if it fails. */
  loadingDone() {
    return this.loading;
  }
}

abstract class AudioContainer<T extends string> extends AudioLoader<T> {
  readonly parent: AudioController;
  protected context: AudioContext;
  constructor(s: AudioController, context: AudioContext, srcs: {[name in T]: string}) {
    super(context, srcs);
    this.context = context;
    this.parent = s;
  }

  /**
   * @param v 0 - 1 (values outside range get clamped)
   */
  abstract setVolume(v: number): void;

  /**
   * @param v 0 - 1
   */
  abstract getVolume(): number;
}

class MusicPlayer<T extends string> extends AudioContainer<T> {
  private readonly fade: GainNode;
  private activeAudio?: AudioBufferSourceNode;
  private volume = 1;
  private readonly volNode: GainNode;

  override setVolume(v: number) {
    v = Math.min(1, Math.max(0, v));
    this.volume = v;
    this.volNode.gain.value = v * this.parent.getVolume();
  }

  override getVolume(): number {
    return this.volume;
  }

  constructor(s: AudioController, context: AudioContext, srcs: {[name in T]: string}) {
    super(s, context, srcs);
    this.context = context;
    this.volNode = context.createGain();

    this.fade = context.createGain();

    let silenceCounter = 0;
    let prev = performance.now();
    setInterval(() => {
      const now = performance.now();
      const dt = (now - prev) / 1000;
      prev = now;

      if (this.state === "changed") {
        this.state = 'fadeout';

        // Check if next data sources are equal to current data
        if (
          this.nextData?.name === this.currentData?.name
        ) {
          // If so replace current data
          this.currentData = this.nextData;
          if (this.currentData) this.currentData.fadeIn = this.currentData.fadeOutPrev;
          this.nextData = undefined;
          this.state = "fadein";
        }
      }

      if (this.state === "fadeout") {
        if (this.nextData) {
          if (this.fade.gain.value) {
            // Fade out if currently playing current data
            if (this.nextData.fadeOutPrev) {
              this.fade.gain.value -= dt / this.nextData.fadeOutPrev;
              this.fade.gain.value = Math.min(Math.max(0, this.fade.gain.value), 1);
            } else if (this.nextData.silence) {
              this.fade.gain.value = 0;
              this.state = "silenceStart";
            } else {
              this.state = "ready";
            }
          } else {
            this.state = "silenceStart";
          }
        } else {
          this.state = "fadein";
        }
      }

      if (this.state === 'silenceStart') {
        silenceCounter = 0;
        this.state = "silence";
      }

      if (this.state === "silence") {
        silenceCounter += dt;
        if (silenceCounter >= (this.nextData?.silence ?? 0)) {
          this.state = "ready";
        }
      }

      if (this.state === "ready") {
        this.currentData = this.nextData;
        this.nextData = undefined;

        this.playCurrent();
        this.state = "fadein";
      }

      if (this.state === "fadein") {
        // Fade in if currently playing current data
        if (this.currentData?.fadeIn) {
          this.fade.gain.value += dt / this.currentData.fadeIn;
          this.fade.gain.value = Math.min(Math.max(0, this.fade.gain.value), 1);
          if (this.fade.gain.value === 1) this.state = undefined;
        } else {
          this.fade.gain.value = 1;
          this.state = undefined;
        }
      }
    });
  }

  private playCurrent() {
    const a = this.setActiveAudio(this.currentData?.name);
    if (!a) return;
    a.loop = true;
    if (this.currentData?.loopStart !== undefined) a.loopStart = this.currentData.loopStart;
    a.loopEnd = a.buffer?.duration ?? this.currentData?.loopEnd ?? 0;
    a.start();
  }

  private setActiveAudio(name?: T | null) {
    if (this.activeAudio) {
      this.activeAudio.stop();
      this.activeAudio.disconnect();
    }
    if (!name) return;
    const b = this.loaded[name];
    if (!b) return;
    const newActiveAudio = this.context.createBufferSource();
    newActiveAudio.buffer = b;
    this.activeAudio = newActiveAudio;
    connectNodes(newActiveAudio, this.volNode, this.fade, this.context.destination);
    return newActiveAudio;
  }

  private nextData?: MusicInput<T>;
  private currentData?: MusicInput<T>;
  private state?: "changed" | "silenceStart" | "silence" | "fadeout" | "fadein" | "ready";
  setMusic(music: MusicInput<T>) {
    const m = {...music};

    this.nextData = m;
    if (this.state !== "silence") {
      this.state = "changed";
    }
  }
}

class SoundPlayer<T extends string> extends AudioContainer<T> {

  private activeSound?: AudioBufferSourceNode;
  private readonly cached: Set<string> = new Set();
  private readonly playing: Map<AudioBufferSourceNode, {volume: GainNode}> = new Map();
  private volume = 1;

  private getFinalVolume() {
    return this.volume * this.parent.getVolume()
  }

  override getVolume(): number {
    return this.volume;
  }

  override setVolume(v: number) {
    v = Math.min(1, Math.max(0, v));
    this.volume = v;
    const fVol = this.getFinalVolume();
    for (const [_, {volume}] of this.playing) {
      volume.gain.value = fVol;
    }
  }

  constructor(s: AudioController, context: AudioContext, srcs: {[name in T]: string}) {
    super(s, context, srcs);
  }

  /**
   * @param name name of sound to be played. Ignore to play no sound
   * @param options.stopPrev stops currently playing sound. Either immediatelly when provided true, or after seconds given by timeout.
   * @param options.sleep prevents the same sound from being played again for given seconds
   */
  play(name?: T | null, options?: {stopPrev?: boolean | {timeout: number}, sleep?: number}) {
    // Only allow a particular sound to be played once per task
    if (name) {
      if (this.cached.has(name)) return;
      this.cached.add(name);
      setTimeout(() => {this.cached.delete(name)}, options?.sleep ? options.sleep * 1000 : undefined);
    }

    const {stopPrev} = options ?? {};
    if (stopPrev && this.activeSound) {
      const prev = this.activeSound;
      if (stopPrev === true) {
        prev.stop();
        prev.disconnect();
        prev.onended = null;
        this.playing.delete(prev);
      } else {
        setTimeout(() => {
          prev.stop();
          prev.disconnect();
          prev.onended = null;
          this.playing.delete(prev);
        }, stopPrev.timeout * 1000);
      }
    }

    if (!name) return;
    const b = this.loaded[name];
    if (!b) return;
    const newActiveSound = this.context.createBufferSource();
    newActiveSound.buffer = b;
    this.activeSound = newActiveSound;
    const volume = this.context.createGain();
    volume.gain.value = this.getFinalVolume();
    connectNodes(newActiveSound, volume, this.context.destination);
    this.playing.set(newActiveSound, {volume});
    newActiveSound.onended = () => {
      this.playing.delete(newActiveSound);
      newActiveSound.disconnect();
      newActiveSound.onended = null;
    }
    newActiveSound.start();
  }
}

export default class AudioController {
  private readonly context = new AudioContext();
  private containers: AudioContainer<any>[] = [];
  private loaded: Promise<void> = Promise.resolve();
  private volume = 1;

  // sound options
  constructor() {
  }

  private resetLoaded() {
    this.loaded = Promise.all(this.containers.map(l => l.loadingDone())).then(() => {});
  }

  init() {
    this.context.resume();
  }

  /**
   * 
   * @returns 0 - 1
   */
  getloadingProgress() {
    const ls = this.containers.length;
    if (!ls) return 1;
    const sum = this.containers.reduce((acc, cur) => {return acc + cur.getloadingProgress()}, 0);
    return sum / ls;
  }

  /** Promise that resolves when loading is done and rejects if it fails. */
  loadingDone() {
    return this.loaded;
  }

  createMusicPlayer<T extends string>(srcs: {[name in T]: string}) {
    const p = new MusicPlayer(this, this.context, srcs);
    p.setVolume(this.volume);
    this.containers.push(p);
    this.resetLoaded();
    return p;
  }

  createSoundPlayer<T extends string>(srcs: {[name in T]: string}) {
    const p = new SoundPlayer(this, this.context, srcs);
    p.setVolume(this.volume);
    this.containers.push(p);
    this.resetLoaded();
    return p;
  }

  setVolume(value: number) {
    this.volume = value;
    this.containers.forEach(c => c.setVolume(c.getVolume()));
  }

  getVolume() { return this.volume; }
}
