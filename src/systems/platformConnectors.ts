import entities from "../entities";

const maxConnectedSpeed = 100;

export default function platformConnections() {
  
  for (const e of entities.view(['platformConnection', 'platformConnectionIsConnected'])) {
    const pc = e.platformConnection;

    if (!pc) continue;

    pc.p1H = pc.p1.position.y - e.position.y;
    pc.p2H = pc.p2.position.y - e.position.y;

    if (pc.p1H <= 0 || pc.p2H <= 0) {
      if (pc.p1H <= 0) pc.p1H = 0;
      if (pc.p2H <= 0) pc.p2H = 0;

      const k1 = pc.p1.kinematic;
      const k2 = pc.p2.kinematic;

      if (k1 && k2) {
        k1.acceleration.y = 0;
        k1.velocity.y = 0;
        k2.velocity.y = 0;
        k2.acceleration.y = 0;
      }

      if (pc.p1.platform) pc.p1.platform.fall = true;
      if (pc.p2.platform) pc.p2.platform.fall = true;

      delete e.platformConnectionIsConnected;
    }
  }
}