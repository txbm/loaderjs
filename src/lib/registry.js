/* @flow */

// This interface and factory represent a registry pattern we use
// several places. Basically just a Map but enforces specific types
// and throws when a lookup fails because want to blow up when stuff
// isn't available at initialization time.

export interface Registry<T> {
  lookup   (name: string): T;
  register (name: string, o: T): void;
};

const makeRegistry = <T>(regName: string) => ({
  _registry: new Map(),
  lookup (name: string): T {
    const o = this._registry.get(name);
    if (o === undefined || o === null) {
      throw new Error(`[${ regName }-registry]: failed to lookup ${ name }`);
    }
    return o;
  },
  register (name: string, o: T): void {
    this._registry.set(name, o);
  }
});

Object.assign(
  exports,
  {
    makeRegistry
  }
);
