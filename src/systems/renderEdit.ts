import { Container, Graphics, Text } from "pixi.js";
import display from "../display";
import { LineSeg, OscillationInit, PlatformConnection, Points, Vine } from "../types";
import smb1enemiesanimationsFactory, { Smb1EnemiesAnimations } from "../sprites/loaders/smb1/enemies";

const texts: Map<string, Text> = new Map();
const removedtexts: Map<string, Text> = new Map();
function printText(x: number, y: number, text: string, c: Container) {
  const key = text + '|' + x + '|' + y;
  removedtexts.delete(key);
  if (!texts.has(key)) {
    const t = new Text(text, {
      fontFamily: "Mario",
      fill: 'white',
      strokeThickness: 5
    });
    t.position.x = x;
    t.position.y = y;
    t.anchor.set(0.5);
    t.scale.set(0.3);
    c.addChild(t);
    texts.set(key, t);
  }
}

function deleteTexts() {
  removedtexts.forEach((t, k) => {
    texts.delete(k);
    t.removeFromParent();
  });
  removedtexts.clear();
}

const bills: Smb1EnemiesAnimations[] = [];
const cheeps: Smb1EnemiesAnimations[] = [];
const jumpingCheeps: Smb1EnemiesAnimations[] = [];
const bowserFires: Smb1EnemiesAnimations[] = [];
const lakitus: Smb1EnemiesAnimations[] = [];
// const angrySuns: Smb1EnemiesAnimations[] = [];
// const medusaHeads: Smb1EnemiesAnimations[] = [];
// const masks: Smb1EnemiesAnimations[] = [];

function adjustSize(c: Container, a: Smb1EnemiesAnimations[], size: number, onAdd: (a: Smb1EnemiesAnimations) => void) {
  while (a.length !== size) {
    if (a.length > size) {
      a.pop()?.container.removeFromParent();
    } else {
      const newa = smb1enemiesanimationsFactory.new();
      c.addChild(newa.container);
      a.push(newa);
      onAdd(newa);
    }
  }
}
function forEachAnim(z: Zone[], a: Smb1EnemiesAnimations[], handler: (zone: Zone, anim: Smb1EnemiesAnimations) => void) {
  for (let i = 0; i < z.length; i++) {
    const zone = z[i];
    const anim = a[i];
    if (zone && anim) handler(zone, anim);
  }
}
function drawZoneEnemy(c: Container, type: ZoneGroup, z: Zone[]) {
  if (type === 'billZones') {
    adjustSize(c, bills, z.length, a => a.setAnimation('bulletbill'));
    forEachAnim(z, bills, (zone, a) => a.container.position.set(zone.x + zone.w - 16, zone.y + 16));
    return true;
  } else if (type === 'cheepZones') {
    adjustSize(c, cheeps, z.length, a => a.setAnimation('greenCheep'));
    forEachAnim(z, cheeps, (zone, a) => a.container.position.set(zone.x + zone.w - 16, zone.y + 16));
    return true;
  } else if (type === 'jumpCheepZones') {
    adjustSize(c, jumpingCheeps, z.length, a => a.setAnimation('redCheep'));
    forEachAnim(z, jumpingCheeps, (zone, a) => {
      a.container.angle = 45;
      return a.container.position.set(zone.x + zone.w - 16, zone.y + 16);
    });
    return true;
  } else if (type === 'fireZones') {
    adjustSize(c, bowserFires, z.length, a => a.setAnimation('bowserfire'));
    forEachAnim(z, bowserFires, (zone, a) => a.container.position.set(zone.x + zone.w - 16, zone.y + 16));
    return true;
  } else if (type === 'lakituZones') {
    adjustSize(c, lakitus, z.length, a => a.setAnimation('lakitu'));
    forEachAnim(z, lakitus, (zone, a) => a.container.position.set(zone.x + zone.w - 16, zone.y + 16));
    return true;
  }
  return false;
}


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

const drawPlatformConnection = (g: Graphics, o: PlatformConnection, color: number) => {
  const scale = display.getScale();

  g.lineStyle(4 / scale, 0xffffff)
  .beginFill(0,0)
  .moveTo(o.pin.x, o.pin.y + o.h1)
  .lineTo(o.pin.x, o.pin.y)
  .lineTo(o.pin.x + o.w, o.pin.y)
  .lineTo(o.pin.x + o.w, o.pin.y + o.h2)
  .endFill();
  g.lineStyle(0,0)
  .beginFill(0xffffff,1)
  .drawCircle(o.pin.x, o.pin.y + o.h1, 4 / scale)
  .endFill();
  g.lineStyle(0,0)
  .beginFill(0xffffff,1)
  .drawCircle(o.pin.x + o.w * 0.5, o.pin.y, 4 / scale)
  .endFill();
  g.lineStyle(0,0)
  .beginFill(0xffffff,1)
  .drawCircle(o.pin.x + o.w, o.pin.y + o.h2, 4 / scale)
  .endFill();

  g.lineStyle(2 / scale, color)
  .beginFill(0,0)
  .moveTo(o.pin.x, o.pin.y + o.h1)
  .lineTo(o.pin.x, o.pin.y)
  .lineTo(o.pin.x + o.w, o.pin.y)
  .lineTo(o.pin.x + o.w, o.pin.y + o.h2)
  .endFill();
  g.lineStyle(0,0)
  .beginFill(color,1)
  .drawCircle(o.pin.x, o.pin.y + o.h1, 3 / scale)
  .endFill();
  g.lineStyle(0,0)
  .beginFill(color,1)
  .drawCircle(o.pin.x + o.w * 0.5, o.pin.y, 3 / scale)
  .endFill();
  g.lineStyle(0,0)
  .beginFill(color,1)
  .drawCircle(o.pin.x + o.w, o.pin.y + o.h2, 3 / scale)
  .endFill();
};

const drawPipe = (g: Graphics, pipe: Points, color: number) => {
  const scale = display.getScale();

  const outer = g.lineStyle(4 / scale, 0x000000).beginFill(0,0);
  for (let i = 1; i < pipe.length; i++) {
    const prev = pipe[i - 1];
    const current = pipe[i];
    if (prev && current) {
      outer.moveTo(prev[0], prev[1]);
      outer.lineTo(current[0], current[1]);
    }
  }
  outer.endFill();

  const p1 = pipe[1];
  const p2 = pipe.at(-2);

  if (p1) {
    g.lineStyle(0,0)
    .beginFill(0x000000,1)
    .drawCircle(p1[0], p1[1], 4 / scale)
    .endFill();
    g.lineStyle(0,0)
    .beginFill(color,1)
    .drawCircle(p1[0], p1[1], 3 / scale)
    .endFill();
  }
  if (p2) {
    g.lineStyle(0,0)
    .beginFill(0x000000,1)
    .drawCircle(p2[0], p2[1], 4 / scale)
    .endFill();
    g.lineStyle(0,0)
    .beginFill(color,1)
    .drawCircle(p2[0], p2[1], 3 / scale)
    .endFill();
  }

  const inner = g.lineStyle(2 / scale, color).beginFill(0,0);
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

type ZoneGroup = "camZones"
| "camPreserveZones"
| "deathZones"
| "underwaterZones"
| "whirlpoolZones"
| "surfaceZones"
| "noMarioInputZones"
| "descendingPlatformZones"
| "jumpCheepZones"
| "cheepZones"
| "lakituZones"
| "billZones"
| "fireZones"
| "maskZones"
| "angrySunZones"
| "medusaHeadZones"
| "loopZones"
| "unloadZones"
| "darkbgZones"

export default function renderEdit(
  c: Container,
  g: Graphics,
  o: Graphics,
  zones: {
    [key in ZoneGroup]: Zone[];
  },
  pipes: Points[],
  vines: Vine[],
  trampolines: Vine[],
  oscillations: OscillationInit[],
  platformRoutes: LineSeg[],
  platformConnections: PlatformConnection[],
  currentZone?: Zone,
  currentPipe?: Points,
  currentVine?: Vine,
  currentTrampoline?: Vine,
  currentOscillation?: OscillationInit,
  currentPlatformRoute?: LineSeg,
  currentPlatformConnection?: PlatformConnection
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

  texts.forEach((t, k) => removedtexts.set(k, t));

  for (const [name, z] of Object.entries(zones) as [ZoneGroup, Zone[]][]) {
    const drewEnem = drawZoneEnemy(c, name, z);

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
      : name === 'descendingPlatformZones'
      ? 0x0000ff
      : 0xff00ff;

    const drawName = !drewEnem && col === 0xff00ff;

    z.forEach(zone => {
      o.lineStyle(4 / scale, name === 'descendingPlatformZones' ? 0 : 0xffffff)
      .beginFill(0, 0)
      .drawRect(zone.x, zone.y, zone.w, zone.h)
      .endFill();
      o.lineStyle(2 / scale, col)
      .beginFill(0, 0)
      .drawRect(zone.x, zone.y, zone.w, zone.h)
      .endFill();

      if (name === 'descendingPlatformZones') {
        o.lineStyle(4 / scale, 0)
        .beginFill(0, 0)
        .moveTo(zone.x + 8, zone.y + 8)
        .lineTo(zone.x + 8, zone.y + zone.h - 8)
        .endFill();
        o.lineStyle(4 / scale, 0)
        .beginFill(0, 0)
        .drawPolygon(
          zone.x + 8 - 2, zone.y + zone.h - 8,
          zone.x + 8 + 2, zone.y + zone.h - 8,
          zone.x + 8, zone.y + zone.h - 8 + 2
        ).endFill();
        o.lineStyle(2 / scale, col)
        .beginFill(0, 0)
        .moveTo(zone.x + 8, zone.y + 8)
        .lineTo(zone.x + 8, zone.y + zone.h - 8)
        .endFill();
        o.lineStyle(2 / scale, col)
        .beginFill(0, 0)
        .drawPolygon(
          zone.x + 8 - 2, zone.y + zone.h - 8,
          zone.x + 8 + 2, zone.y + zone.h - 8,
          zone.x + 8, zone.y + zone.h - 8 + 2
        ).endFill();

        o.lineStyle(4 / scale, 0)
        .beginFill(0, 0)
        .moveTo(zone.x + zone.w - 8, zone.y + 8)
        .lineTo(zone.x + zone.w - 8, zone.y + zone.h - 8)
        .endFill();
        o.lineStyle(4 / scale, 0)
        .beginFill(0, 0)
        .drawPolygon(
          zone.x + zone.w - 8 - 2, zone.y + 8,
          zone.x + zone.w - 8 + 2, zone.y + 8,
          zone.x + zone.w - 8, zone.y + 8 - 2
        ).endFill();
        o.lineStyle(2 / scale, col)
        .beginFill(0, 0)
        .moveTo(zone.x + zone.w - 8, zone.y + 8)
        .lineTo(zone.x + zone.w - 8, zone.y + zone.h - 8)
        .endFill();
        o.lineStyle(2 / scale, col)
        .beginFill(0, 0)
        .drawPolygon(
          zone.x + zone.w - 8 - 2, zone.y + 8,
          zone.x + zone.w - 8 + 2, zone.y + 8,
          zone.x + zone.w - 8, zone.y + 8 - 2
        ).endFill();
      } else {
        if (drawName) {
          printText(zone.x + zone.w * 0.5, zone.y + 10, name.replace('Zones', ''), c);
        }
      }
    });
  }

  deleteTexts();

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
      drawPipe(o, pipe, 0xffff00);
    }
  }

  if (currentPipe) {
    drawPipe(o, currentPipe, 0xffffff);
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

  for (const p of platformConnections) {
    drawPlatformConnection(o, p, 0x0000ff);
  }

  if (currentPlatformConnection) {
    drawPlatformConnection(o, currentPlatformConnection, 0xaa00ff);
  }
}