import { BaseTexture, SCALE_MODES } from "pixi.js";

// setup pixijs
BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST; // removes blurriness

// disable zoom
document.addEventListener('wheel', e => e.ctrlKey && e.preventDefault(), {
  passive: false,
});