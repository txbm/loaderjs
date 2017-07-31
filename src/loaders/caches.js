'use strict';

module.exports = {};

const builders = require('./builders');

const LazyRecordLoaderCache = (viewer) => ({
  _cache: new Map(),
  get (recordDef) {
    if (!this._cache.has(recordDef.name)) {
      this._cache.set(recordDef.name, builders.buildRecordLoaders(recordDef, viewer));
    }
    return this._cache.get(recordDef.name);
  },
  clear () {
    this._cache.clear();
  }
});

const LazyConnectionLoaderCache = (viewer) => ({
  _cache: new Map(),
  get (connectionDef) {
    if (!this._cache.has(connectionDef.name)) {
      this._cache.set(connectionDef.name, builders.buildConnectionLoaders(connectionDef, viewer));
    }
    return this._cache.get(connectionDef.name);
  },
  clear () {
    this._cache.clear();
  }
});

const ViewerLoaderCache = {
  _cache: new Map(),
  get (viewer) {
    if (!this._cache.has(viewer.id)) {
      this._cache.set(viewer.id, {
        records: LazyRecordLoaderCache(viewer),
        connections: LazyConnectionLoaderCache(viewer)
      });
    }

    return this._cache.get(viewer.id);
  },
  clear (viewer) {
    if (this._cache.has(viewer.id)) {
      this._cache.get(viewer.id).records.clear();
      this._cache.get(viewer.id).connections.clear();
      this._cache.delete(viewer.id);
    }
  }
};


module.exports.LazyRecordLoaderCache = LazyRecordLoaderCache;
module.exports.LazyConnectionLoaderCache = LazyConnectionLoaderCache;
module.exports.ViewerLoaderCache = ViewerLoaderCache;
