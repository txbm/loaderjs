/* @flow */

import type {
  Backend
} from './interface';

const BackendRegistry = {
  _registry: new Map(),
  lookup (name: string): Backend {
    const ds = this._registry.get(name);
    if (ds === undefined || ds === null) {
      throw new Error('[Loader Panic]: Backend lookup failed.');
    }
    return ds;
  },
  register (name: string, ds: Backend): void {
    this._registry.set(name, ds);
  }
};

// Object.assign(exports, {
//   BackendRegistry
// });

exports.BackendRegistry = BackendRegistry;
