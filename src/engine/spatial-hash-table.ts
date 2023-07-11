type Unit<UserData> = {
  l: number;
  t: number;
  w: number;
  h: number;
  _cellsData: Map<Cell<UserData>, [index: number, i: number, j: number]>;
  _queryID: symbol;
  userData: UserData;
}

type Cell<UserData> = Unit<UserData>[];

const nullQueryID = Symbol("null-query-id");

let queryDebugID = Number.MIN_SAFE_INTEGER;

export default class SpatialHashTable<UserData> {
  readonly size: number;
  constructor(size: number) {
    this.size = size;
  }

  readonly cells: Map<string, Cell<UserData>> = new Map();

  private initCell(i: number, j: number) {
    const cell: Cell<UserData> = [];
    this.cells.set(i + "." + j, cell);
    return cell;
  }

  private getCell(i: number, j: number) {
    return this.cells.get(i + "." + j);
  }

  private toGridBounds(l: number, t: number, w: number, h: number) {
    return {
      imin: Math.floor(l / this.size),
      imax: Math.floor((l + w) / this.size),
      jmin: Math.floor(t / this.size),
      jmax: Math.floor((t + h) / this.size)
    }
  }

  private removeFromCell(cell: Cell<UserData>, index: number, u: Unit<UserData>) {
    const last = cell[cell.length - 1];
    if (last) {
      cell[index] = last;
      const d = last._cellsData.get(cell);
      if (d) d[0] = index;
    }
    cell.pop();
    u._cellsData.delete(cell);
  }

  /** Puts unit in all cells it should belong to */
  private set(u: Unit<UserData>) {
    const b = this.toGridBounds(u.l, u.t, u.w, u.h);
    for (let j = b.jmin; j <= b.jmax; j++) {
      for (let i = b.imin; i <= b.imax; i++) {
        const cell = this.getCell(i, j) ?? this.initCell(i, j);
        if (u._cellsData.get(cell) === undefined) {
          const length = cell.push(u);
          u._cellsData.set(cell, [length - 1, i, j]);
        }
      }
    }
  }

  /** Removes unit from cells it doesn't belong to */
  private unset(u: Unit<UserData>) {
    const b = this.toGridBounds(u.l, u.t, u.w, u.h);
    for (const [cell, [index, i, j]] of u._cellsData) {
      if (i < b.imin || i > b.imax || j < b.jmin || j > b.jmax) {
        this.removeFromCell(cell, index, u);
      }
    }
  }

  create(l: number, t: number, w: number, h: number, d: UserData): Unit<UserData> {
    const u = {
      _cellsData: new Map(),
      _queryID: nullQueryID,
      l,t,w,h,
      userData: d
    }
    this.set(u);
    return u;
  }

  update(u: Unit<UserData>) {
    this.unset(u);
    this.set(u);
  }

  /** Removes unit from all cells */
  remove(u: Unit<UserData>) {
    for (const [cell, [index]] of u._cellsData) {
      this.removeFromCell(cell, index, u);
    }
  }

  *findNear(l: number, t: number, w: number, h: number) {
    const queryID = Symbol(String(queryDebugID++));
    const b = this.toGridBounds(l, t, w, h);
    for (let j = b.jmin; j <= b.jmax; j++) {
      for (let i = b.imin; i <= b.imax; i++) {
        const c = this.getCell(i, j);
        if (c) for (const u of c) {
          if (u._queryID === queryID) continue;
          u._queryID = queryID;
          yield u;
        }
      }
    }
  }

  *findNearCells(l: number, t: number, w: number, h: number): Generator<[i: number, j: number], void, unknown> {
    const b = this.toGridBounds(l, t, w, h);
    for (let j = b.jmin; j <= b.jmax; j++) {
      for (let i = b.imin; i <= b.imax; i++) {
        yield [i, j];
      }
    }
  }
}
