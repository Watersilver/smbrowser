import SpatialHashTable from "./engine/spatial-hash-table";
import { Entity } from "./entities";


// Actively check for collisions with kinematics and statics
const dynamics = new SpatialHashTable<Entity>(32);

// Can move
const kinematics = new SpatialHashTable<Entity>(32);

const statics = new SpatialHashTable<Entity>(32);

const sensors = new SpatialHashTable<Entity>(32);

const grid = new SpatialHashTable<Entity>(32);

const worldGrid = {dynamics, kinematics, statics, sensors, grid};
export default worldGrid;