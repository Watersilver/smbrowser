import { BaseTexture, SCALE_MODES } from "pixi.js";

// setup pixijs
BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST; // removes blurriness