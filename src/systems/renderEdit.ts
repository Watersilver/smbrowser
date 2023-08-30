import { Graphics } from "pixi.js";
import display from "../display";

type Zone = {x: number; y: number; w: number; h: number;};

export default function renderEdit(g: Graphics, o: Graphics, zones: {
  camZones: Zone[];
  camPreserveZones: Zone[];
  deathZones: Zone[];
  underwaterZones: Zone[];
  whirlpoolZones: Zone[];
  surfaceZones: Zone[];
  noMarioInputZones: Zone[];
}, currentZone?: Zone) {
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

  if (currentZone) {
    let x = 0, y = 0, w = 0, h = 0;
    if (currentZone.w > 0) {
      x = currentZone.x;
      w = currentZone.w;
    } else {
      x = currentZone.x + currentZone.w;
      w = -currentZone.w;
    }
    if (currentZone.h > 0) {
      y = currentZone.y;
      h = currentZone.h;
    } else {
      y = currentZone.y + currentZone.h;
      h = -currentZone.h;
    }
    o.lineStyle(4 / scale, 0xffffff)
    .beginFill(0, 0)
    .drawRect(x, y, w, h)
    .endFill();
    o.lineStyle(2 / scale, 0x000000)
    .beginFill(0, 0)
    .drawRect(x, y, w, h)
    .endFill();
  }

  for (const [name, z] of Object.entries(zones)) {
    const col =
      name === 'camZones'
      ? 0xffff00
      : name === 'noCamZones'
      ? 0xffaa99
      : name === 'deathZones'
      ? 0xff0000
      : name === 'underwaterZones'
      ? 0x0000ff
      : name === 'whirlpoolZones'
      ? 0x00ff00
      : name === 'surfaceZones'
      ? 0x00ffff
      : 0xff00ff;
    z.forEach(zone => {
      o.lineStyle(4 / scale, 0xffffff)
      .beginFill(0, 0)
      .drawRect(zone.x, zone.y, zone.w, zone.h)
      .endFill();
      o.lineStyle(2 / scale, col)
      .beginFill(0, 0)
      .drawRect(zone.x, zone.y, zone.w, zone.h)
      .endFill();
    })
  }
}