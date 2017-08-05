const loaders = require('./loaders/index');
const authorization = require('./authorization');
const registry = require('./modelers/record-model').RecordModelRegistry;

const syncMeta = (recordName, instance) => {
  if (instance) {
    instance.__meta__ = registry.get(recordName);
  }
  return instance;
};

const linkRecordDefReference = (recordDef, instance) => {
  if (!instance) return;
  instance.__meta__ = recordDef;
};

const linkConnectionDefReference = (connectionDef, instance) => {
  if (!instance) return;
  instance.__meta__ = connectionDef;
};

const clearViewerState = viewer => {
  loaders.caches.ViewerLoaderCache.clear(viewer);
  authorization.GrantCache.clear(viewer.id);
};

const paginateRecordCollection = (recordDef, collection, slice, cursor) => {
  if (slice) {
    return collection.slice(slice.offset || 0, slice.limit + (slice.offset || 0));
  }

  if (cursor) {
    const after = parseInt(cursor.after);
    return collection.slice(after || 0, cursor.first + (after || 0));
  }

  // Implement before/last

  return collection;
};

const paginateConnectionCollection = (connectionDef, collection, slice, cursor) => {
  if (slice) {
    return collection.slice(slice.offset || 0, slice.limit + (slice.offset || 0));
  }

  // if (cursor) {
  //   const after = parseInt(cursor.after);
  //   return collection.slice(after || 0, cursor.first + (after || 0));
  // }

  return collection;
};

exports.linkRecordDefReference = linkRecordDefReference;
exports.clearViewerState = clearViewerState;
exports.paginateRecordCollection = paginateRecordCollection;
exports.paginateConnectionCollection = paginateConnectionCollection;
exports.linkConnectionDefReference = linkConnectionDefReference;
exports.syncMeta = syncMeta;
