// https://github.com/SanderMertens/ecs-faq
// https://github.com/hmans/miniplex

type IsOptional<T, K extends keyof T> = { [K1 in Exclude<keyof T, K>]: T[K1] } & { K?: T[K] } extends T ? K : never;
type OptionalKeys<T> = { [K in keyof T]: IsOptional<T, K> }[keyof T];
type View<Entity> = {
  entities: Entity[];
  entToIndex: Map<Entity, number>;
}

export default class Ecs<Entity extends {
  [componentName: string | symbol]: unknown;
}> {
  private entities: Entity[] = [];
  private entToIndex: Map<Entity, number> = new Map();
  private targetToProxy: WeakMap<Entity, Entity> = new WeakMap();

  private views: {
    [view: string]: View<Entity>
  } = {};

  private queuedActions: {action: () => void, cancelled?: boolean}[] = [];
  private hadCompsAdded: Set<Entity> = new Set();
  private hadCompsRemoved: Set<Entity> = new Set();
  private toBeRemoved: Set<Entity> = new Set();
  private toBeAdded: Set<Entity> = new Set();

  private hasComponent(e: {[c: string]: unknown}, c: string) {
    return e[c] !== undefined;
  }

  private *toBeRemovedIterator(): Generator<[Entity, View<Entity> | null]> {
    for (const ent of this.toBeRemoved) {
      if (!this.entityExists(ent)) continue;

      yield [ent, null]; // main view

      for (const view of Object.values(this.views)) {
        if (view.entToIndex.has(ent)) {
          yield [ent, view]; // other views
        }
      }
    }
  }

  private *hadCompsRemovedIterator(skip?: Set<Entity>): Generator<[Entity, View<Entity>]> {
    for (const ent of this.hadCompsRemoved) {
      if (!this.entityExists(ent)) continue;

      if (skip?.has(ent)) continue;

      for (const [key, view] of Object.entries(this.views)) {
        if (view.entToIndex.has(ent) && key.split("/").some(c => !this.hasComponent(ent, c))) {
          yield [ent, view];
        }
      }
    }
  }

  private *toBeAddedIterator(skip?: Set<Entity>): Generator<[Entity, View<Entity> | null]> {
    for (const ent of this.toBeAdded) {
      if (this.entityExists(ent)) continue;

      if (skip?.has(ent)) continue;

      yield [ent, null]; // main view

      for (const [key, view] of Object.entries(this.views)) {
        if (key.split("/").every(c => this.hasComponent(ent, c))) {
          yield [ent, view]; // other views
        }
      }
    }
  }

  private *hadCompsAddedIterator(...skip: Set<Entity>[]): Generator<[Entity, View<Entity>]> {
    for (const ent of this.hadCompsAdded) {
      if (!this.entityExists(ent)) continue;

      for (const s of skip) if (s.has(ent)) continue;
  
      for (const [key, view] of Object.entries(this.views)) {
        if (!view.entToIndex.has(ent) && key.split("/").every(c => this.hasComponent(ent, c))) {
          yield [ent, view];
        }
      }
    }
  }

  update() {
    // Call onRemoving handlers when removing entity from world
    for (const [e, v] of this.toBeRemovedIterator()) {
      const entities = v?.entities ?? this.entities;
      const h = this.viewToOnRemovingHandlers.get(entities);
      if (h) for (const handler of h) handler(e);
    }

    // Call onRemoving handlers when removing from view because of component delete
    for (const [e, v] of this.hadCompsRemovedIterator(this.toBeRemoved)) {
      const h = this.viewToOnRemovingHandlers.get(v.entities);
      if (h) for (const handler of h) handler(e);
    }

    // Call onAdding handlers when adding entity to world
    for (const [e, v] of this.toBeAddedIterator(this.toBeRemoved)) {
      const entities = v?.entities ?? this.entities;
      const h = this.viewToOnAddingHandlers.get(entities);
      if (h) for (const handler of h) handler(e);
    }

    // Call onAdding handlers when adding components to entity
    for (const [e, v] of this.hadCompsAddedIterator(this.toBeRemoved, this.toBeAdded)) {
      const h = this.viewToOnAddingHandlers.get(v.entities);
      if (h) for (const handler of h) handler(e);
    }

    // Remove entities from world
    for (const [e, v] of this.toBeRemovedIterator()) {
      console.log(e);
      this.removeFromView(e, v ?? undefined);
    }

    // Update views for removed components
    for (const [e, v] of this.hadCompsRemovedIterator(this.toBeRemoved)) {
      this.removeFromView(e, v);
    }

    // Add entitites to world
    for (const [e, v] of this.toBeAddedIterator(this.toBeRemoved)) {
      const entities = v?.entities ?? this.entities;
      const entToIndex = v?.entToIndex ?? this.entToIndex;
      const l = entities.push(e);
      entToIndex.set(e, l - 1);
    }

    // Update view for added components
    for (const [e, v] of this.hadCompsAddedIterator(this.toBeRemoved, this.toBeAdded)) {
      const l = v.entities.push(e);
      v.entToIndex.set(e, l - 1);
    }

    // Clean up
    this.toBeRemoved.clear();
    this.hadCompsRemoved.clear();
    this.toBeAdded.clear();
    this.hadCompsAdded.clear();

    // Call queued actions
    for (const a of this.queuedActions) {
      if (!a.cancelled) a.action();
    }
    this.queuedActions = [];
  }

  enqueue(action: () => void) {
    const a = {action,cancelled: false};
    this.queuedActions.push(a) - 1;

    type Cancel = () => void;
    const c: Cancel = () => a.cancelled = true;
    return c;
  }

  createEntity(components: Entity) {
    const target = {...components};
    const self = this;
    const entity = new Proxy(target, {
      deleteProperty: (t, p) => {
        const removed = delete t[p];
        const e = self.targetToProxy.get(t);
        if (removed && e) self.hadCompsRemoved.add(e);
        return removed;
      },
      defineProperty(t, property: keyof Entity, attributes) {
        const val = attributes.get ? attributes.get() : attributes.value;
        const prev = t[property];
        t[property] = val;
        const e = self.targetToProxy.get(t);
        if (prev !== undefined && val === undefined) {
          // prev existed, current does not
          if (e) self.hadCompsRemoved.add(e);
        } else if (val !== undefined && prev === undefined) {
          // current exists, prev did not
          if (e) self.hadCompsAdded.add(e);
        }
        return true;
      },
    });
    this.targetToProxy.set(target, entity);

    this.toBeAdded.add(entity);

    return entity;
  }

  entityExists(e: Entity) {
    return this.entToIndex.has(e);
  }

  private removeFromView(entity: Entity, view?: View<Entity>) {
    const entities = view?.entities ?? this.entities;
    const entToIndex = view?.entToIndex ?? this.entToIndex;

    const i = entToIndex.get(entity);
    if (i === undefined) return false;

    const last = entities.length - 1;

    const temp = entities[last];

    if (!temp) return false;

    entities[last] = entity;
    entities[i] = temp;
    entities.pop();

    return true;
  }

  remove(entity: Entity) {
    return this.toBeRemoved.add(entity);
  }

  private constructViewKey(components: string[]) {
    return [...new Set(components)].sort().join("/");
  }

  view(requiredComponents?: Extract<OptionalKeys<Entity>, string>[]): readonly Entity[] {
    if (!requiredComponents) return this.entities;
    const r = this.constructViewKey(requiredComponents);
    if (r === "") return this.entities;
    let v = this.views[r];
    if (v) return v.entities;
    const illegal = requiredComponents.some(c => /\//.test(c));
    if (illegal) throw Error("Illegal character in component: '/'. Please do not use this character in your component name.");
    v = {
      entities: this.entities.filter(e => !requiredComponents.some(c => !this.hasComponent(e, c))),
      entToIndex: new Map()
    };
    v.entities.forEach((e, i) => v?.entToIndex.set(e, i));
    this.views[r] = v;
    return v.entities;
  }

  private viewToOnAddingHandlers: Map<readonly Entity[], ((entity: Entity) => void)[]> = new Map();
  onAdding(viewType: Extract<OptionalKeys<Entity>, string>[], handler: (entity: Entity) => void) {
    const v = this.view(viewType);
    const handlers = this.viewToOnAddingHandlers.get(v) || [];
    this.viewToOnAddingHandlers.set(v, handlers);
    handlers.push(handler);
  }

  private viewToOnRemovingHandlers: Map<readonly Entity[], ((entity: Entity) => void)[]> = new Map();
  onRemoving(viewType: Extract<OptionalKeys<Entity>, string>[], handler: (entity: Entity) => void) {
    const v = this.view(viewType);
    const handlers = this.viewToOnRemovingHandlers.get(v) || [];
    this.viewToOnRemovingHandlers.set(v, handlers);
    handlers.push(handler);
  }
}
