/*       */

             
         
                     

const BackendRegistry = {
  _registry: new Map(),
  lookup (name        )          {
    const ds = this._registry.get(name);
    if (ds === undefined || ds === null) {
      throw new Error('[Loader Panic]: Backend lookup failed.');
    }
    return ds;
  },
  register (name        , ds         )       {
    this._registry.set(name, ds);
  }
};

// Object.assign(exports, {
//   BackendRegistry
// });

exports.BackendRegistry = BackendRegistry;
