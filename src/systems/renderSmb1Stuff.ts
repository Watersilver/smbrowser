import entities from "../entities";
import systemUtils from "./utils";

systemUtils.addRemoveRenderable('smb1MarioAnimations');
systemUtils.addRemoveRenderable('smb1ObjectsSprites');
systemUtils.addRemoveRenderable('smb1ObjectsAnimations');
systemUtils.addRemoveRenderable('smb1TilesAnimations');
systemUtils.addRemoveRenderable('smb1TilesSprites');
systemUtils.addRemoveRenderable('smb1TilesSpritesEditMode');

entities.onRemoving(['invisibleBlock'], e => {
  if (e.smb1TilesSprites?.container) {
    e.smb1TilesSprites.container.visible = true;
  }
});

let timing = 0;
let editModePrev: boolean | undefined = undefined;

export default function renderSmb1Stuff(dt: number, editMode?: boolean) {
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

  systemUtils.updateRenderablePos('smb1MarioAnimations');
  systemUtils.updateRenderablePos('smb1ObjectsSprites');
  systemUtils.updateRenderablePos('smb1TilesSprites');
  systemUtils.updateRenderablePos('smb1ObjectsAnimations');

  if (editMode) {
    systemUtils.updateRenderablePos('smb1TilesSpritesEditMode');
  } else {
    systemUtils.updateRenderablePos('smb1TilesAnimations');

    const prevT = timing;
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

    const changed = Math.floor(prevT) !== Math.floor(timing);
    for (const e of entities.view(['smb1TilesSprites', 'brokenBrick'])) {
      const s = e.smb1TilesSprites;
      if (!s) continue;
      if (changed) s.container.scale.x = -s.container.scale.x;
    }

    for (const e of entities.view(['coinFromBlockLife'])) {
      e.position.y -= dt * 111;
      if (e.coinFromBlockLife) {
        e.coinFromBlockLife -= dt;
        if (e.coinFromBlockLife <= 0) {
          entities.remove(e);
        }
      }

      if (e.smb1ObjectsAnimations) {
        e.smb1ObjectsAnimations.update(dt);
      }
    }
  }
}