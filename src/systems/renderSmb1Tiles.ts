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

entities.onRemoving(['invisibleBlock'], e => {
  if (e.smb1TilesSprites?.container) {
    e.smb1TilesSprites.container.visible = true;
  }
});

entities.onPropChange('smb1TilesSpritesEditMode', (e, a) => {
  if (a?.container.parent) a?.container.removeFromParent();
  if (e.smb1TilesSpritesEditMode?.container) {
    if (a) {
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }
    display.add(e.smb1TilesSpritesEditMode.container);
  }
});

entities.onRemoving(['smb1TilesSpritesEditMode'], e => {
  if (e.smb1TilesSpritesEditMode?.container.parent) {
    e.smb1TilesSpritesEditMode.container.removeFromParent();
  }
});

entities.onPropChange('smb1TilesAnimations', (e, a) => {
  if (a?.container.parent) a?.container.removeFromParent();
  if (e.smb1TilesAnimations?.container) {
    if (a) {
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }
    display.add(e.smb1TilesAnimations.container);
  }
});

entities.onRemoving(['smb1TilesAnimations'], e => {
  if (e.smb1TilesAnimations?.container.parent) {
    e.smb1TilesAnimations.container.removeFromParent();
  }
});

let timing = 0;
let editModePrev: boolean | undefined = undefined;

export default function renderSmb1Tiles(dt: number, editMode?: boolean) {
  if (editModePrev === undefined || editModePrev !== !!editMode) {
    editModePrev = !!editMode;

    for (const e of entities.view(['smb1TilesAnimations', 'smb1TilesSpritesEditMode'])) {
      if (editMode) {
        if (e.smb1TilesSpritesEditMode) e.smb1TilesSpritesEditMode.container.visible = true;
        if (e.smb1TilesAnimations) e.smb1TilesAnimations.container.visible = false;
      } else {
        if (e.smb1TilesSpritesEditMode) e.smb1TilesSpritesEditMode.container.visible = false;
        if (e.smb1TilesAnimations) e.smb1TilesAnimations.container.visible = true;
      }
    }

    for (const e of entities.view(['smb1TilesSprites', 'invisibleBlock'])) {
      if (!e.smb1TilesSprites) continue;
      if (editMode) {
        if (e.invisibleBlock) e.smb1TilesSprites.container.visible = true;
      } else {
        if (e.invisibleBlock) e.smb1TilesSprites.container.visible = false;
      }
    }
  }

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

  if (editMode) {
    for (const e of entities.view(['dynamic', 'smb1TilesSpritesEditMode'])) {
      const a = e.smb1TilesSpritesEditMode;
      if (!a) continue;
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }
  
    for (const e of entities.view(['kinematic', 'smb1TilesSpritesEditMode'])) {
      const a = e.smb1TilesSpritesEditMode;
      if (!a) continue;
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }
  } else {
    for (const e of entities.view(['dynamic', 'smb1TilesAnimations'])) {
      const a = e.smb1TilesAnimations;
      if (!a) continue;
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }
  
    for (const e of entities.view(['kinematic', 'smb1TilesAnimations'])) {
      const a = e.smb1TilesAnimations;
      if (!a) continue;
      a.container.position.x = e.position.x;
      a.container.position.y = e.position.y;
    }
  
    timing = (timing + dt * 8 * 1.1) % 8;
    let i = 0;
    if (timing > 4) {
      i = Math.floor(timing - 4);
      if (i === 3) i = 1;
    }

    for (const e of entities.view(['smb1TilesAnimations'])) {
      const a = e.smb1TilesAnimations;
      if (!a) continue;
      a.setFrame(i);
    }
  }
}