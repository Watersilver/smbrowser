import { Display } from "../display";
import { aabb } from "../engine";
import entities from "../entities";
import Collidable from "../utils/collidable";
import zones from "../zones";

// Preload views
entities.view(['mario']);

// Mario sky
// #9290FF

let skyR = 0x92;
let skyG = 0x90;
let skyB = 0xFF;

// Dark
// #051525

let darkR = 0x05;
let darkG = 0x15;
let darkB = 0x25;

let currentR = skyR;
let currentG = skyG;
let currentB = skyB;

let targetR = currentR;
let targetG = currentG;
let targetB = currentB;

const c1 = new Collidable();
const c2 = new Collidable();

function getBGCol() {
  let r = Math.floor(currentR).toString(16);
  let g = Math.floor(currentG).toString(16);
  let b = Math.floor(currentB).toString(16);

  if (r.length === 1) r = '0' + r;
  if (g.length === 1) g = '0' + g;
  if (b.length === 1) b = '0' + b;

  return "#" + r + g + b;
}

let currentCol = getBGCol();

export default function bgColor(dt: number, display: Display) {

  const dark = entities.view(['mario']).some(m => zones.darkbg.some(z => aabb.pointVsRect(m.position, c2.setToZone(z))));

  if (dark) {
    targetR = darkR;
    targetG = darkG;
    targetB = darkB;
  } else {
    targetR = skyR;
    targetG = skyG;
    targetB = skyB;
  }

  const prevCol = currentCol;

  currentR += 2 * dt * (targetR - currentR);
  currentG += 2 * dt * (targetG - currentG);
  currentB += 2 * dt * (targetB - currentB);

  currentCol = getBGCol();

  if (prevCol !== currentCol) {
    display.setBGColor(currentCol);
  }
}