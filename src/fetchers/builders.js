'use strict';

const co = require('co');
const { coroutine } = require('bluebird');
const camelcase = require('camelcase');
const invariant = require('invariant');

module.exports = {};

const { log } = require('../logging');
const helpers = require('../helpers');
const authorization = require('../authorization');
const fetcherNames = require('./names');
const loaders = require('../loaders/index');
const modelers = require('../modelers/index');
const backends = require('../backends/index');

const getRecordLoaders = (
  viewer,
  recordDef
) => loaders.caches.ViewerLoaderCache.get(viewer).records.get(recordDef);

const getConnectionLoaders = (
  viewer,
  connectionDef
) => loaders.caches.ViewerLoaderCache.get(viewer).connections.get(connectionDef);

const callLoader = (loader, key) => loader.load(key)
  .then(r => r)
  .catch(err => {
    if (err.queryId) {
      throw new Error(
       `
        Loader encountered an error while querying the backing store.
        The specific error has been logged but elided from this message for security.
        Use query key : ${ err.queryId } to search logs for the exact datastore error.`);
    }
    throw err;
  });

const makeCanonicalRecordFetcher = recordDef => {
  return co.wrap(function * (viewer, key) {
    if (!key) return null;

    const recordLoaders = getRecordLoaders(viewer, recordDef);
    const result = yield callLoader(
      recordLoaders.canonical,
      key.toString());

    return authorization.authorize(recordDef, viewer, result);
  });
};

const makeVanityRecordFetcher = (recordDef, vanityFieldName) => {
  return co.wrap(function * (viewer, key) {
    if (!key) return null;

    const recordLoaders = getRecordLoaders(viewer, recordDef);
    const result = yield callLoader(
      recordLoaders[loaders.names.recordVanityLoader(recordDef, vanityFieldName)],
      key.toString());

    return authorization.authorize(recordDef, viewer, result);
  });
};

const makeCollectionRecordFetcher = (recordDef, collection) => {
  return co.wrap(function * (viewer, keyObj) {
    if (!keyObj || !keyObj.key) return null;

    keyObj.key = keyObj.key.toString();
    const recordLoaders = getRecordLoaders(viewer, recordDef);

    const results = yield callLoader(
      recordLoaders[loaders.names.recordCollectionLoader(recordDef, collection)],
      keyObj);

    const authed = yield Promise.all(
      results.map(res => authorization.authorize(recordDef, viewer, res)));

    const filtered = authed.filter(a => a !== null);
    helpers.linkRecordDefReference(recordDef, filtered);
    filtered.__pageInfo__ = results.__pageInfo__;
    return filtered;
  });
};

const makeCollectionRecordMultiTargetFetcher = (recordDef, collection) => {
  return co.wrap(function * (viewer, keyObj) {
    if (!keyObj || !keyObj.keys || !keyObj.keys[0]) return null;

    keyObj.keys = keyObj.keys.map(k => k.toString());
    const recordLoaders = getRecordLoaders(viewer, recordDef);

    const results = yield callLoader(
      recordLoaders[loaders.names.recordCollectionMultiTargetLoader(
        recordDef, collection
      )],
      keyObj);

    const authed = yield Promise.all(
      results.map(res => authorization.authorize(recordDef, viewer, res)));

    const filtered = authed.filter(a => a !== null);
    helpers.linkRecordDefReference(recordDef, filtered);
    filtered.__pageInfo__ = results.__pageInfo__;
    return filtered;
  });
};

const makeRecordGrantContextFetcher = (recordDef, collection) => {
  return co.wrap(function * (viewer) {
    const recordLoaders = getRecordLoaders(viewer, recordDef);

    return callLoader(
      recordLoaders[loaders.names.recordGrantContextLoader(
        recordDef, collection
      )],
      { key: viewer.id.toString() }
    );
  });
};

// Doesn't use a loader because fetching all records has no fetch key.
const makeAllRecordFetcher = (recordDef) => {
  return co.wrap(function * (viewer, keyObj) {
    if (!keyObj) return null;

    const { slice, cursor } = keyObj;
    const rows = yield datastores.all({ recordDef, keyObj });

    const authed = yield Promise.all(
      rows.map(
        row => recordDef.methods.fetch(viewer, row[recordDef.canonicalKey])));

    const filtered = authed.filter(a => a !== null);

    const paginated = helpers.paginateRecordCollection(
      recordDef,
      filtered,
      slice,
      cursor
    );

    helpers.linkRecordDefReference(recordDef, paginated);
    paginated.__pageInfo__ = {
      total: filtered.length
    };
    return paginated;
  });
};

const makeConnectionCollectionFetcher = (connectionDef, collection) => {
  return co.wrap(function * (viewer, keyObj) {

    if (!keyObj || !keyObj.keys || !keyObj.keys[0]) return null;

    keyObj.keys = keyObj.keys.map(k => k.toString());
    const connectionLoaders = getConnectionLoaders(viewer, connectionDef);

    const results = yield callLoader(
      connectionLoaders[loaders.names.connectionCollectionLoader(
        connectionDef, collection
      )],
      keyObj
    );

    helpers.linkConnectionDefReference(connectionDef, results);
    results.__pageInfo__ = {
      total: results.length
    };

    return results;
  });
};

const buildRecordCollectionFetchers = recordDef => {
  if (!recordDef.collections) return;
  const contexts = {};

  for (const collection of recordDef.collections) {
    collection.namespace = collection.namespace ? collection.namespace : recordDef.namespace;
    if (collection.fetchKeys) {
      recordDef.methods[fetcherNames.recordCollectionFetcher(collection)] = makeCollectionRecordMultiTargetFetcher(recordDef, collection);

      // @HACK
      if (collection.withRecord) {
        collection.getRecordFieldsSingularPrefixed = () => {
          const defs = collection.getRecordDefs();
          const fieldLookup = {};
          for (const fetchKey of collection.fetchKeys) {
            fieldLookup[fetchKey.record] = defs[fetchKey.record].fieldsSingularPrefixed;
          }
          fieldLookup[recordDef.name] = recordDef.fieldsSingularPrefixed;
          collection.namespace = modelers.recordModel.RecordModelRegistry.get(collection.withRecord).namespace;
          return fieldLookup;
        };
      }

      collection.getRecordDefs = () => {
        const defs = {};
        for (const fetchKey of collection.fetchKeys) {
          fetchKey.record = fetchKey.record ? fetchKey.record : recordDef.name;
          defs[fetchKey.record] = modelers.recordModel.RecordModelRegistry.get(fetchKey.record);
        }
        return defs;
      };

      collection.getRecordFieldsLookupPrefixed = () => {
        const defs = collection.getRecordDefs();
        const fieldLookup = {};
        for (const fetchKey of collection.fetchKeys) {
          fieldLookup[fetchKey.record] = defs[fetchKey.record].fieldsPrefixed;
        }
        fieldLookup[recordDef.name] = recordDef.fieldsPrefixed;
        return fieldLookup;
      };

      collection.getRecordFieldsLookupRegular = () => {
        const defs = collection.getRecordDefs();
        const fieldLookup = {};
        for (const fetchKey of collection.fetchKeys) {
          fieldLookup[fetchKey.record] = defs[fetchKey.record].fieldsRegular;
        }
        fieldLookup[recordDef.name] = recordDef.fieldsRegular;
        return fieldLookup;
      };

      collection.getRecordFieldsList = () => {
        const defs = collection.getRecordDefs();
        let fieldList = [];
        for (const fetchKey of collection.fetchKeys) {
          const fieldLookup = {};
          fieldList = fieldList.concat(
            Object.values(defs[fetchKey.record].fieldsPrefixed)
          );
        }
        fieldList = fieldList.concat(Object.values(recordDef.fieldsPrefixed));
        return fieldList;
      };
    } else {
      recordDef.methods[fetcherNames.recordCollectionFetcher(collection)] = makeCollectionRecordFetcher(recordDef, collection);
      collection.fetchKey.record = collection.fetchKey.record ? collection.fetchKey.record : recordDef.name;
      collection.getRecordDef = () => modelers.recordModel.RecordModelRegistry.get(collection.fetchKey.record);


      // This is a serious @HACK
      if (collection.withRecord) {
        collection.getRecordFieldsLookup = () => {
          collection.namespace = modelers.recordModel.RecordModelRegistry.get(collection.withRecord).namespace;
          return {
            [ recordDef.name ]: recordDef.fieldsSingularPrefixed,
            [ collection.fetchKey.record ]: collection.getRecordDef().fieldsSingularPrefixed
          };
        };

        collection.getFieldsList = () => Object.values(
          recordDef.fieldsSingularPrefixed
        ).concat(Object.values(collection.getRecordDef().fieldsSingularPrefixed));
      } else if (collection.namespace !== recordDef.namespace) {
        collection.getRecordFieldsLookup = () => ({
          [ recordDef.name ]: recordDef.fieldsPrefixed,
          [ collection.fetchKey.record ]: collection.getRecordDef().fieldsPrefixed
        });
        collection.getFieldsList = () => Object.values(
          recordDef.fieldsPrefixed
        ).concat(Object.values(collection.getRecordDef().fieldsPrefixed));
      } else {
        collection.getRecordFieldsLookup = () => ({
          [ recordDef.name ]: recordDef.fieldsRegular,
          [ collection.fetchKey.record ]: collection.getRecordDef().fieldsRegular
        });
        collection.getFieldsList = () => Object.values(
          recordDef.fieldsRegular
        ).concat(Object.values(collection.getRecordDef().fieldsRegular));
      }

    }

    collection.namespace = collection.namespace ? collection.namespace : recordDef.namespace;

    if (collection.grant) {
      contexts[collection.grant] = makeRecordGrantContextFetcher(recordDef, collection);
    }
  }
  recordDef.grantContexts = contexts;
};

const buildConnectionCollectionFetchers = connectionDef => {
  if (!connectionDef.collections) return;
  const methods = {};

  for (const collection of connectionDef.collections) {
    methods[fetcherNames.connectionCollectionFetcher(collection)] = makeConnectionCollectionFetcher(
      connectionDef,
      collection
    );
  }

  return methods;
};

module.exports.makeCanonicalRecordFetcher = makeCanonicalRecordFetcher;
module.exports.makeVanityRecordFetcher = makeVanityRecordFetcher;
module.exports.makeCollectionRecordFetcher = makeCollectionRecordFetcher;
module.exports.makeCollectionRecordMultiTargetFetcher = makeCollectionRecordMultiTargetFetcher;
module.exports.makeRecordGrantContextFetcher = makeRecordGrantContextFetcher;
module.exports.makeAllRecordFetcher = makeAllRecordFetcher;
module.exports.buildRecordCollectionFetchers = buildRecordCollectionFetchers;
module.exports.buildConnectionCollectionFetchers = buildConnectionCollectionFetchers;
