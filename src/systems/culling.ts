// https://gamedev.stackexchange.com/questions/14713/culling-for-a-2d-platformer-game

// Will try built in culling

import { Display } from "../display";
// import entities from "../entities";

// const camRect: {l: number; t: number; r: number; b: number;} = {l: 0, t: 0, r: 0, b: 0};
// const entRect: {x: number; y: number; w: number; h: number;} = {x: 0, y: 0, w: 0, h: 0};
// const px = 10, py = 10;

export default function culling(display: Display) {
  // const tl = display.fromViewport(0, 0);
  // const br = display.fromViewport(display.getViewportWidth(), display.getViewportHeight());
  // camRect.l = tl[0];
  // camRect.t = tl[1];
  // camRect.r = br[0];
  // camRect.b = br[1];

  // // First try naive solution
  // for (const e of entities.view(['smb1MarioAnimations'])) {
  //   entRect.x = e.position.x - e.size.x - px;
  //   entRect.y = e.position.y - e.size.y - py;
  //   entRect.w = e.size.x + px * 2;
  //   entRect.h = e.size.y + py * 2;

  //   if (
  //     entRect.x + entRect.w < camRect.l
  //     || entRect.x > camRect.r
  //     || entRect.y + entRect.h < camRect.t
  //     || entRect.y > camRect.b
  //   ) {
  //     // Invisible
  //     if (e.smb1MarioAnimations) e.smb1MarioAnimations.container.visible = false;
  //   } else {
  //     // Visible
  //     if (e.smb1MarioAnimations) e.smb1MarioAnimations.container.visible = true;
  //   }
  // }
}