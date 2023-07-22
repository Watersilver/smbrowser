type StateMachineUpdate = (dt: number) => void;

export default abstract class State<ConnectionIDs extends string = string, Input = undefined, Output = undefined> {
  abstract onStart(i: Input): void;
  abstract onEnd(): [output: Output, next: ConnectionIDs];
  abstract onUpdate(dt: number): boolean;

  private connections: Map<ConnectionIDs, State<any, Output, any>> = new Map();
  connect(to: State<any, Output, any>, connectionID: ConnectionIDs) {
    if (this.connections.has(connectionID)) throw Error("Connection already exists");
    this.connections.set(connectionID, to);
  }

  start(i: Input): StateMachineUpdate {
    let init = true;
    let state: State<any, any, any> | null = null;

    return (dt: number) => {
      if (!state) {
        if (!init) return;
        this.onStart(i);
        i = null as any; // dunno if needed but delete for garbage collection purposes
        state = this;
      }
      
      const res = state.onUpdate(dt);

      if (res === false) {
        state = state.end();
      }
    }
  }

  end() {
    const [out, id] = this.onEnd();
    const next = this.connections.get(id);
    if (next) {
      next.onStart(out);
      return next;
    }
    return null;
  }
}
