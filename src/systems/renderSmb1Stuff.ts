import entities from "../entities";
import systemUtils from "./utils";

systemUtils.addRemoveRenderable('smb1MarioAnimations');
systemUtils.addRemoveRenderable('smb1ObjectsSprites');
systemUtils.addRemoveRenderable('smb1ObjectsAnimations');
systemUtils.addRemoveRenderable('smb1EnemiesAnimations');
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

    for (const e of entities.view(['smb1TilesSprites', 'smb1TilesSpritesEditMode'])) {
      if (editMode) {
        if (e.smb1TilesSpritesEditMode) e.smb1TilesSpritesEditMode.container.visible = true;
        if (e.smb1TilesSprites) e.smb1TilesSprites.container.visible = false;
      } else {
        if (e.smb1TilesSpritesEditMode) e.smb1TilesSpritesEditMode.container.visible = false;
        if (e.smb1TilesSprites) e.smb1TilesSprites.container.visible = true;
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

  systemUtils.updateRenderable('smb1MarioAnimations', dt);
  systemUtils.updateRenderable('smb1ObjectsSprites', dt);
  systemUtils.updateRenderable('smb1TilesSprites', dt);
  systemUtils.updateRenderable('smb1ObjectsAnimations', dt);
  systemUtils.updateRenderable('smb1EnemiesAnimations', dt);

  // Enemy facing
  for (const e of entities.view(['smb1EnemiesAnimations', 'enemy'])) {
    if (!e.smb1EnemiesAnimations || !e.enemy) continue;

    let dir = 0;
    switch (e.enemy.lookTowards) {
      case 'direction':
        dir = Math.sign(e.dynamic?.velocity.x || e.kinematic?.velocity.x || 0);
        break;
      case 'mario':
        const m = entities.view(['mario'])[0];
        if (m) {
          dir = Math.sign(m.position.x - e.position.x);
        }
        break;
    }
    if (dir) e.smb1EnemiesAnimations.container.scale.x = -dir;
  }

  if (editMode) {
    systemUtils.updateRenderable('smb1TilesSpritesEditMode', dt);
  } else {
    systemUtils.updateRenderable('smb1TilesAnimations', dt);

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

    for (const e of entities.view(['collectedCoin'])) {
      if (e.collectedCoin) {
        e.collectedCoin.lifetime += dt;
        if (e.collectedCoin.lifetime >= 0.5) {
          entities.remove(e);
        }
        const displacement = Math.sin(e.collectedCoin.lifetime * Math.PI / 0.6);
        e.position.y = e.positionStart.y - displacement * 48;
      }
      if (e.smb1ObjectsAnimations && e.positionStart.y - e.position.y > 25) {
        e.smb1ObjectsAnimations.container.zIndex = 2;
      }
    }

    for (const e of entities.view(['smb1ObjectsAnimations'])) {
      const a = e.smb1ObjectsAnimations;
      if (!a) continue;
      a.update(dt);
    }

    for (const e of entities.view(['smb1EnemiesAnimations'])) {
      const a = e.smb1EnemiesAnimations;
      if (!a) continue;
      a.update(dt);
    }

    for (const e of entities.view(['fireballHit', 'smb1ObjectsAnimations'])) {
      if (e.smb1ObjectsAnimations?.didLoop()) {
        entities.remove(e);
        e.smb1ObjectsAnimations.container.visible = false;
        delete e.smb1ObjectsAnimations;
      }
    }
  }

  for (const e of entities.view(['platformConnection'])) {
    const p = e.platformConnection;
    if (!p) continue;
    const r1 = p.rope1.smb1TilesSprites;
    const r2 = p.rope2.smb1TilesSprites;
    if (!r1 || !r2) continue;

    const scaley1 = p.p1H / 16;

    r1.container.scale.y = scaley1;

    r1.container.position.y = p.rope1.position.y + p.p1H * 0.5 - 8;

    const scaley2 = p.p2H / 16;

    r2.container.scale.y = scaley2;

    r2.container.position.y = p.rope2.position.y + p.p2H * 0.5 - 8;
  }
}