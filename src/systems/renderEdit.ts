import { Graphics } from "pixi.js";
import display from "../display";
import { LineSeg, OscillationInit, Points, Vine } from "../types";

type Zone = {x: number; y: number; w: number; h: number;};

const drawVine = (o: Graphics, vine: Vine, color: number) => {
  const scale = display.getScale();

  o.lineStyle(4 / scale, 0x000000)
  .beginFill(0,0)
  .moveTo(vine.x, vine.y)
  .lineTo(vine.x, vine.y - vine.h)
  .endFill();
  o.lineStyle(0,0)
  .beginFill(0x000000,1)
  .drawCircle(vine.x, vine.y, 4 / scale)
  .endFill();
  o.lineStyle(0,0)
  .beginFill(0x000000,1)
  .drawRect(vine.x - 10 / scale, vine.y - vine.h - 2 / scale, 20 / scale, 4 / scale)
  .endFill();

  o.lineStyle(2 / scale, color)
  .beginFill(0,0)
  .moveTo(vine.x, vine.y)
  .lineTo(vine.x, vine.y - vine.h)
  .endFill();
  o.lineStyle(0,0)
  .beginFill(color,1)
  .drawCircle(vine.x, vine.y, 3 / scale)
  .endFill();
  o.lineStyle(0,0)
  .beginFill(color,1)
  .drawRect(vine.x - 9 / scale, vine.y - vine.h - 1 / scale, 18 / scale, 2 / scale)
  .endFill();
};

const drawOscillation = (g: Graphics, o: OscillationInit, color: number) => {
  const scale = display.getScale();

  g.lineStyle(0,0)
  .beginFill(0xffffff,1)
  .drawCircle(o.pstart.x, o.pstart.y, 4 / scale)
  .endFill();
  g.lineStyle(4 / scale, 0xffffff)
  .beginFill(0,0)
  .moveTo(o.pstart.x, o.pstart.y)
  .lineTo(o.p1.x, o.p1.y)
  .moveTo(o.p1.x, o.p1.y)
  .lineTo(o.p2.x, o.p2.y)
  .endFill();
  g.lineStyle(0,0)
  .beginFill(0xffffff,1)
  .drawCircle(o.p2.x, o.p2.y, 4 / scale)
  .endFill();

  g.lineStyle(0,0)
  .beginFill(color,1)
  .drawCircle(o.pstart.x, o.pstart.y, 3 / scale)
  .endFill();
  g.lineStyle(2 / scale, color)
  .beginFill(0,0)
  .moveTo(o.pstart.x, o.pstart.y)
  .lineTo(o.p1.x, o.p1.y)
  .moveTo(o.p1.x, o.p1.y)
  .lineTo(o.p2.x, o.p2.y)
  .endFill();
  g.lineStyle(0,0)
  .beginFill(color,1)
  .drawCircle(o.p2.x, o.p2.y, 3 / scale)
  .endFill();
};

const drawPlatformRoute = (g: Graphics, o: LineSeg, color: number) => {
  const scale = display.getScale();

  g.lineStyle(0,0)
  .beginFill(0xffffff,1)
  .drawCircle(o.p1.x, o.p1.y, 4 / scale)
  .endFill();
  g.lineStyle(4 / scale, 0xffffff)
  .beginFill(0,0)
  .moveTo(o.p1.x, o.p1.y)
  .lineTo(o.p2.x, o.p2.y)
  .endFill();

  g.lineStyle(0,0)
  .beginFill(color,1)
  .drawCircle(o.p1.x, o.p1.y, 3 / scale)
  .endFill();
  g.lineStyle(2 / scale, color)
  .beginFill(0,0)
  .moveTo(o.p1.x, o.p1.y)
  .lineTo(o.p2.x, o.p2.y)
  .endFill();
};

export default function renderEdit(g: Graphics, o: Graphics, zones: {
    camZones: Zone[];
    camPreserveZones: Zone[];
    deathZones: Zone[];
    underwaterZones: Zone[];
    whirlpoolZones: Zone[];
    surfaceZones: Zone[];
    noMarioInputZones: Zone[];
  },
  pipes: Points[],
  vines: Vine[],
  trampolines: Vine[],
  oscillations: OscillationInit[],
  platformRoutes: LineSeg[],
  currentZone?: Zone,
  currentPipe?: Points,
  currentVine?: Vine,
  currentTrampoline?: Vine,
  currentOscillation?: OscillationInit,
  currentPlatformRoute?: LineSeg,
) {
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

  for (const [name, z] of Object.entries(zones)) {
    const col =
      name === 'camZones'
      ? 0xffff00
      : name === 'camPreserveZones'
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

  for (const pipe of pipes) {
    if (pipe) {
      const outer = o.lineStyle(4 / scale, 0x000000).beginFill(0,0);
      for (let i = 1; i < pipe.length; i++) {
        const prev = pipe[i - 1];
        const current = pipe[i];
        if (prev && current) {
          outer.moveTo(prev[0], prev[1]);
          outer.lineTo(current[0], current[1]);
        }
      }
      outer.endFill();
      const inner = o.lineStyle(2 / scale, 0xffff00).beginFill(0,0);
      for (let i = 1; i < pipe.length; i++) {
        const prev = pipe[i - 1];
        const current = pipe[i];
        if (prev && current) {
          outer.moveTo(prev[0], prev[1]);
          outer.lineTo(current[0], current[1]);
        }
      }
      inner.endFill();
    }
  }

  if (currentPipe) {
    const pipe = currentPipe;
    const outer = o.lineStyle(4 / scale, 0x000000).beginFill(0,0);
    for (let i = 1; i < pipe.length; i++) {
      const prev = pipe[i - 1];
      const current = pipe[i];
      if (prev && current) {
        outer.moveTo(prev[0], prev[1]);
        outer.lineTo(current[0], current[1]);
      }
    }
    outer.endFill();
    const inner = o.lineStyle(2 / scale, 0xffffff).beginFill(0,0);
    for (let i = 1; i < pipe.length; i++) {
      const prev = pipe[i - 1];
      const current = pipe[i];
      if (prev && current) {
        outer.moveTo(prev[0], prev[1]);
        outer.lineTo(current[0], current[1]);
      }
    }
    inner.endFill();
  }

  for (const vine of vines) {
    drawVine(o, vine, 0x00ff00);
  }

  if (currentVine) {
    drawVine(o, currentVine, 0x00ffff);
  }

  for (const vine of trampolines) {
    drawVine(o, vine, 0xff0000);
  }

  if (currentTrampoline) {
    drawVine(o, currentTrampoline, 0xff9933);
  }

  for (const osc of oscillations) {
    drawOscillation(o, osc, 0x0000ff);
  }

  if (currentOscillation) {
    drawOscillation(o, currentOscillation, 0xaa00ff);
  }

  for (const p of platformRoutes) {
    drawPlatformRoute(o, p, 0x0000ff);
  }

  if (currentPlatformRoute) {
    drawPlatformRoute(o, currentPlatformRoute, 0xaa00ff);
  }
}