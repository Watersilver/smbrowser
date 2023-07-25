import { Graphics } from "pixi.js";
import entities from "../entities";

export default function debugRender(graphics: Graphics) {
  for (const ent of entities.view()) {
    const col = ent.dynamic ? 0xffff00 : 0x00ffff;

    // Render center
    graphics
    .lineStyle(0, 0, 0)
    .beginFill(col, 1)
    .drawCircle(ent.position.x, ent.position.y, 2)
    .endFill();

    // Render facing
    if (ent.mario?.facing) {
      graphics
      .lineStyle(2, col, 1)
      .beginFill(0, 0)
      .moveTo(ent.position.x, ent.position.y)
      .lineTo(ent.position.x + ent.mario.facing * 10, ent.position.y)
      .endFill();
    }

    // Render bounding box
    graphics
    .lineStyle(2, col, 1)
    .beginFill(0, 0)
    .drawRect(ent.position.x - ent.size.x * 0.5, ent.position.y - ent.size.y * 0.5, ent.size.x, ent.size.y)
    .endFill();
  }

  for (const ent of entities.view()) {
    // Render touching
    if (ent.touchingDown?.length) {
      const l = ent.touchingDown.length;
      graphics
      .lineStyle(2, l === 1 ? 0xff0000 : l === 2 ? 0xff00ff : 0xffffff)
      .beginFill(0, 0)
      .moveTo(ent.position.x - ent.size.x * 0.5, ent.position.y + ent.size.y * 0.5)
      .lineTo(ent.position.x + ent.size.x * 0.5, ent.position.y + ent.size.y * 0.5)
      .endFill();
    }
    if (ent.touchingUp?.length) {
      const l = ent.touchingUp.length;
      graphics
      .lineStyle(2, l === 1 ? 0xff0000 : l === 2 ? 0xff00ff : 0xffffff)
      .beginFill(0, 0)
      .moveTo(ent.position.x - ent.size.x * 0.5, ent.position.y - ent.size.y * 0.5)
      .lineTo(ent.position.x + ent.size.x * 0.5, ent.position.y - ent.size.y * 0.5)
      .endFill();
    }
    if (ent.touchingLeft?.length) {
      const l = ent.touchingLeft.length;
      graphics
      .lineStyle(2, l === 1 ? 0xff0000 : l === 2 ? 0xff00ff : 0xffffff)
      .beginFill(0, 0)
      .moveTo(ent.position.x - ent.size.x * 0.5, ent.position.y - ent.size.y * 0.5)
      .lineTo(ent.position.x - ent.size.x * 0.5, ent.position.y + ent.size.y * 0.5)
      .endFill();
    }
    if (ent.touchingRight?.length) {
      const l = ent.touchingRight.length;
      graphics
      .lineStyle(2, l === 1 ? 0xff0000 : l === 2 ? 0xff00ff : 0xffffff)
      .beginFill(0, 0)
      .moveTo(ent.position.x + ent.size.x * 0.5, ent.position.y - ent.size.y * 0.5)
      .lineTo(ent.position.x + ent.size.x * 0.5, ent.position.y + ent.size.y * 0.5)
      .endFill();
    }
  }
}