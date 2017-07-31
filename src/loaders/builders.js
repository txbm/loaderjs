'use strict';

const co = require('co');
const DataLoader = require('dataloader');

module.exports = {};

const names = require('./names');
const datastore = require('../datastores/index');
const caches = require('./caches');

const buildConnectionLoaders = (connectionDef, viewer) => {
  const viewerLoaders = caches.ViewerLoaderCache.get(viewer);
  const connectionLoaders = {};

  for (const collection of connectionDef.collections) {
    connectionLoaders[names.connectionCollectionLoader(connectionDef, collection)] = new DataLoader(
      co.wrap(function * (keyObjs) {
        return datastore.connectionCollection({
          connectionDef,
          collection,
          keyObjs,
          viewerLoaders
        });
      }),
      { cacheKeyFn: k => k.keys.join('-') }
    );
  }

  return connectionLoaders;
};

const buildRecordLoaders = (recordDef, viewer) => {
  const viewerLoaders = caches.ViewerLoaderCache.get(viewer);
  const recordLoaders = {};

  recordLoaders.canonical = new DataLoader(keys => {
    return datastore.canonical({ recordDef, keys, viewerLoaders });
  });

  recordLoaders[names.recordAllLoader(recordDef)] = new DataLoader(keys => {
    return datastore.all({ recordDef, keys, viewerLoaders });
  }, { cacheKeyFn: k => true });

  for (const collection of recordDef.collections) {

    if (collection.fetchKeys) {
      recordLoaders[names.recordCollectionMultiTargetLoader(recordDef, collection)] = new DataLoader(co.wrap(function * (keyObjs) {
        return datastore.collectionMulti({
          recordDef, collection, keyObjs, viewerLoaders
        });
      }), { cacheKeyFn: k => k.keys.join('-') });
    } else {
      recordLoaders[names.recordCollectionLoader(recordDef, collection)] = new DataLoader(co.wrap(function * (keyObjs) {
        return datastore.collection({
          recordDef, collection, keyObjs, viewerLoaders
        });
      }), { cacheKeyFn: k => k.key });

      if (collection.grant) {
        recordLoaders[names.recordGrantContextLoader(recordDef, collection)] = new DataLoader(co.wrap(function * (keyObjs) {
          return datastore.collection({
            recordDef, collection, keyObjs, forGrant: true, viewerLoaders
          });
        }), { cacheKeyFn: k => k.key });
      }
    }
  }

  for (const fieldName in recordDef.fields) {
    const field = recordDef.fields[fieldName];
    if (field.vanity) {
      recordLoaders[names.recordVanityLoader(recordDef, fieldName)] = new DataLoader(keys => {
        return datastore.vanity({
          recordDef, vanityFieldName: fieldName, keys, viewerLoaders
        });
      });
    }
  }

  return recordLoaders;
};

module.exports.buildRecordLoaders = buildRecordLoaders;
module.exports.buildConnectionLoaders = buildConnectionLoaders;
