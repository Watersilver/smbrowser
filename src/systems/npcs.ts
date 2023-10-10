import { Text } from "pixi.js";
import { Display } from "../display";
import entities from "../entities";

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
      for (const s of split) {
        const res = /<wait:([0-9]+)>/gm.exec(s);
        const time = Number(res?.[1]);
        if (!Number.isNaN(time)) delay += time;

        const part = new Text(s);
        part.position.x = e.position.x;
        part.position.y = e.position.y;
        display.add(part);

        e.npc.parsed.text.push({
          delay,
          part
        });
      }
    }
  }
}