import entities from "../entities";

export default function marioPlayerInput(dt: number) {
  for (const e of entities.view(['marioInput', 'marioMovementConfig', 'dynamic'])) {
    const config = e.marioMovementConfig;
    const i = e.marioInput;
    const d = e.dynamic;
    if (config && i && d) {
      
    }
  }
}