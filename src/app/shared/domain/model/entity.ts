export interface Identifiable {
  id: string;
}

export abstract class Entity {
  clone(): this {
    const copy = Object.create(Object.getPrototypeOf(this)) as this;
    return Object.assign(copy, structuredClone({ ...this }));
  }
}

export type AggregateRoot = Entity & Identifiable;
