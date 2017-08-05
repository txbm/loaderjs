'use strict';

const invariant = require('invariant');

module.exports = {};

const pgImpl = require('./pg/impl');

const Datastores = Object.freeze({
  POSTGRES: 0
});

const DatastoreNameByValue = {};
for (const datastore in Datastores) {
  const val = Datastores[datastore];
  DatastoreNameByValue[val] = datastore;
};

const QueryMap = {
  canonical: {
    [Datastores.POSTGRES]: pgImpl.canonical
  },
  vanity: {
    [Datastores.POSTGRES]: pgImpl.vanity
  },
  collection: {
    [Datastores.POSTGRES]: pgImpl.collection
  },
  collectionMulti: {
    [Datastores.POSTGRES]: pgImpl.collectionMulti
  },
  all: {
    [Datastores.POSTGRES]: pgImpl.all
  },
  connectionCollection: {
    [Datastores.POSTGRES]: pgImpl.connectionCollection
  }
};

const mapQuery = (queryType, datastore) => {
  invariant(
    QueryMap[queryType],
    `Unknown query type ${ queryType } specified.
    Available types are ${ Object.keys(QueryMap) }`);
  invariant(
    DatastoreNameByValue[datastore],
    `Unknown datastore specified.
    Available stores are ${ Object.keys(Datastores) }`);

  const query = QueryMap[queryType][datastore];

  invariant(
    query && typeof query === 'function',
    `Query type ${ queryType } is not implemented
    for datastore ${ DatastoreNameByValue[datastore] }`);

  return query;
};

const canonical = (args) =>
  mapQuery('canonical', args.recordDef.datastore)(args);

const vanity = (args) =>
  mapQuery('vanity', args.recordDef.datastore)(args);

const collection = (args) => {
  const { keyObjs } = args;

  invariant(
    keyObjs.length > 0,
    'You must specify at least one key object for collection lookup.');

  const keyRec = keyObjs[0];
  invariant(
    (keyRec.cursor && !keyRec.slice) ||
    (keyRec.slice && !keyRec.cursor) ||
    (!keyRec.cursor && !keyRec.slice),
    'You cannot mix and match slice and cursor. Pick one or use neither.');

  invariant(
    (keyRec.sort && keyRec.sort.key) || !keyRec.sort,
    'Must specify a key if using a sort');

  return mapQuery('collection', args.recordDef.datastore)(args);
};

const collectionMulti = (args) =>
  mapQuery('collectionMulti', args.recordDef.datastore)(args);

const all = (args) =>
  mapQuery('all', args.recordDef.datastore)(args);

const connectionCollection = (args) =>
  mapQuery('connectionCollection', args.connectionDef.datastore)(args);


module.exports.canonical = canonical;
module.exports.vanity = vanity;
module.exports.collection = collection;
module.exports.collectionMulti = collectionMulti;
module.exports.all = all;
module.exports.connectionCollection = connectionCollection;
module.exports.Datastores = Datastores;
