import { Text } from "pixi.js";
import { Display } from "../display";
import entities from "../entities";

// Preload views
entities.view(['npc']);
entities.view(['mario']);

entities.onPropChange('npc', (_, prev) => {
  if (prev?.parsed) {
    prev.parsed.text.forEach(t => t.part.removeFromParent());
  }
});

entities.onRemoving(['npc'], e => {
  if (e.npc?.parsed) {
    e.npc.parsed.text.forEach(t => t.part.removeFromParent());
  }
});

export default function npcs(dt: number, display: Display) {
  for (const e of entities.view(['npc'])) {
    if (!e.npc) continue;

    if (!e.npc.parsed) {
      e.npc.parsed = {
        t: 0,
        text: []
      };
      const split = e.npc.text.split('|');
      let delay = 0;
      let i = 0;
      let col = '';
      for (let s of split) {
        const wait = /<wait:([0-9]+(\.[0-9]){0,1})>/gm;
        const waitRes = wait.exec(s);
        const time = Number(waitRes?.[1]);
        if (!Number.isNaN(time)) delay += time;

        s = s.replace(wait, '');

        const color = /<color:([#a-zA-Z0-9]+)>/gm;
        const colorRes = color.exec(s);
        col = colorRes?.[1] || col;

        s = s.replace(color, '');

        const part = new Text(s.trim(), {
          fontFamily: "Mario",
          fill: col || 'white',
          strokeThickness: 5
        });
        part.visible = false;
        part.scale.set(0.2);
        part.zIndex = 100;
        part.position.x = e.position.x;
        part.position.y = e.position.y - e.size.y * 0.5 - 8 - (split.length - 1 - i) * part.height;
        part.anchor.set(0.5, 1);
        display.add(part);

        e.npc.parsed.text.push({
          delay,
          part
        });
        i++;
      }
    }

    const close = entities.view(['mario']).filter(m => {
      const isClose = m.position.distance(e.position) < 32;
      if (isClose) {
        if (m.finalCutscene) {
          m.finalCutscene.close = e;
        }
      }
      return isClose;
    });

    if (close.length) {
      e.npc.parsed.t += dt;
    } else {
      e.npc.parsed.t = 0;
    }

    for (const t of e.npc.parsed.text) {
      if (t.delay < e.npc.parsed.t) {
        if (!t.part.visible) t.part.visible = true;
      } else {
        if (t.part.visible) t.part.visible = false;
      }
    }
  }
}