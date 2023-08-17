import { Graphics } from "pixi.js";
import display from "../display";

export default function renderEdit(g: Graphics, o: Graphics) {
  const [l, t] = display.fromViewport(0, 0);
  const [r, b] = display.fromViewport(display.getViewportWidth(), display.getViewportHeight());

  const scale = display.getScale();

  const size = scale < 1 && scale >= 0.499 ? 'medium' : scale < 0.499 && scale > 0.2 ? 'far' : scale <= 0.2 ? 'farther' : 'close';
  const step = size === 'medium' ? 32 : size === 'far' ? 0 : size === 'close' ? 16 : 0;

  if (!step) return;

  for (let i = l; i < r + step; i = i + step) {
    const x = Math.floor(i / step) * step;
    g.lineStyle(2 / scale, 0x440011)
    .beginFill(0, 0)
    .moveTo(x, t)
    .lineTo(x, b)
    .endFill();
  }

  for (let j = t; j < b + step; j = j + step) {
    const y = Math.floor(j / step) * step;
    g.lineStyle(2 / scale, 0x440011)
    .beginFill(0, 0)
    .moveTo(l, y)
    .lineTo(r, y)
    .endFill();
  }

  const [mx, my] = display.getMousePos();
  const x = Math.floor(mx / 16) * 16;
  const y = Math.floor(my / 16) * 16;
  o.lineStyle(3 / scale, 0xffff00)
  .beginFill(0, 0)
  .drawRect(x, y, 16, 16)
  .endFill();
}