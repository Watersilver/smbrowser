import display from "../display";
import entities from "../entities";

entities.onPropChange('smb1TilesSprites', (e, a) => {
  if (a?.container.parent) a?.container.removeFromParent();
  if (e.smb1TilesSprites?.container) {
    if (a) {
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }
    display.add(e.smb1TilesSprites.container);
  }
});

entities.onRemoving(['smb1TilesSprites'], e => {
  if (e.smb1TilesSprites?.container.parent) {
    e.smb1TilesSprites.container.removeFromParent();
  }
});

export default function renderSmb1Tiles() {
  for (const e of entities.view(['dynamic', 'smb1TilesSprites'])) {
    const a = e.smb1TilesSprites;
    if (!a) continue;
    a.container.position.x = e.position.x;
    a.container.position.y = e.position.y;
  }

  for (const e of entities.view(['kinematic', 'smb1TilesSprites'])) {
    const a = e.smb1TilesSprites;
    if (!a) continue;
    a.container.position.x = e.position.x;
    a.container.position.y = e.position.y;
  }
}