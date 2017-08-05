/*       */

// This interface and factory represent a registry pattern we use
// several places. Basically just a Map but enforces specific types
// and throws when a lookup fails because want to blow up when stuff
// isn't available at initialization time.

                              
                             
                                      
 ;

const makeRegistry =    (regName        ) => ({
  _registry: new Map(),
  lookup (name        )    {
    const o = this._registry.get(name);
    if (o === undefined || o === null) {
      throw new Error(`[${ regName }-registry]: failed to lookup ${ name }`);
    }
    return o;
  },
  register (name        , o   )       {
    this._registry.set(name, o);
  }
});

Object.assign(
  exports,
  {
    makeRegistry
  }
);
