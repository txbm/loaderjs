'use strict';

const co = require('co');
const { coroutine } = require('bluebird');
const invariant = require('invariant');
const SQL = require('sql-template-strings');

const helpers = require('../../helpers');
const marshallers = require('./marshallers');
const queries = require('./queries');
const modelers = require('../../modelers/index');

const callQueryLoader = query => queries.queryLoader.load(query)
  .then(result => result)
  .catch(err => { throw err; });

const canonical = co.wrap(function * ({ recordDef, keys }) {
  const query = SQL``;
  const fieldNames = Object.keys(recordDef.fields);

  query.append(queries.selectStatement(fieldNames, recordDef.namespace));
  query.append(` WHERE`);
  query.append(queries.whereInClause(recordDef.canonicalKey, keys));

  const pgResult = yield callQueryLoader(query);
  const rows = queries.parseResultIntoRows(pgResult) || [];

  return marshallers.convertRowsToModels(
    recordDef,
    rows,
    keys,
    recordDef.canonicalKey
  );
});

const vanity = co.wrap(function * ({ recordDef, vanityFieldName, keys }) {
  const query = SQL``;
  const fieldNames = Object.keys(recordDef.fields);

  query.append(queries.selectStatement(fieldNames, recordDef.namespace));
  query.append(` WHERE`);
  query.append(queries.whereInClause(vanityFieldName, keys));

  const pgResult = yield callQueryLoader(query);
  const rows = queries.parseResultIntoRows(pgResult);

  return marshallers.convertRowsToModels(
    recordDef,
    rows,
    keys,
    vanityFieldName
  );
});

const collectionMultiQuery = co.wrap(function * ({
  recordDef, collection, keyObjs, forGrant = false, viewerLoaders
}) {
  const query = SQL``;
  const { sort, slice, cursor } = keyObjs[0];
  const keys = keyObjs.map(ko => ko.keys);
  const keysVertical = keys[0].map(k => []);
  let fieldLookup;

  if (collection.withRecord) {
    fieldLookup = collection.getRecordFieldsSingularPrefixed();
  } else if (collection.namespace !== recordDef.namespace) {
    fieldLookup = collection.getRecordFieldsLookupPrefixed();
  } else {
    fieldLookup = collection.getRecordFieldsLookupRegular();
  }

  let tablename = collection.namespace;

  let filterQuery;

  const recordKeyField = fieldLookup[recordDef.name][recordDef.canonicalKey];
  const fetchKeyFields = collection.fetchKeys.map(fk => fieldLookup[fk.record][fk.key]);

  const selectFieldList = [ recordKeyField, ...fetchKeyFields ];

  keys.forEach(key => {
    key.forEach((k, idx) => {
      keysVertical[idx].push(k);
    });
  });

  if (collection.filters) {
    filterQuery = SQL``;
    for (const filter of collection.filters) {
      filter.record = filter.record ? filter.record : recordDef.name;
      const filterField = fieldLookup[filter.record][filter.key];
      selectFieldList.push(filterField);
      filterQuery
        .append(` AND ${ filterField } ${ filter.predicate } `);
      if (filter.value === null) {
        filterQuery.append('NULL');
      } else {
        filterQuery.append(SQL`${ filter.value }`);
      }
    }
  }

  query.append(queries.selectStatement(selectFieldList, tablename));
  query.append(` WHERE`);

  fetchKeyFields.forEach((fk, idx, arr) => {
    if (idx !== 0) {
      query.append(` AND`);
    }
    query.append(queries.whereInClause(fk, keysVertical[idx]));
  });

  if (filterQuery) {
    query.append(filterQuery);
  }

  if (sort && sort.key) {
    if (!sort.record && !sort.connection) {
      sort.record = recordDef.name;
    }

    if (sort.record) {
      query.append(
        ` ORDER BY ${ fieldLookup[sort.record][sort.key] } ${ sort.reverse ? 'ASC' : 'DESC' }`);
    }

    // Pretty @HACK
    if (sort.connection) {
      const connectionDef = modelers.connectionModel.ConnectionModelRegistry.get(
        sort.connection
      );

      query.append(
        ` ORDER BY ${ connectionDef.fieldsPrefixed[sort.key] } ${ sort.reverse ? 'ASC' : 'DESC' }`);
    }
  }

  const pgResult = yield callQueryLoader(query);
  const rows = queries.parseResultIntoRows(pgResult);

  const collected = marshallers.convertRowsToMultiTargetModelCollections(
    recordDef,
    viewerLoaders,
    rows,
    keys,
    recordKeyField,
    fetchKeyFields,
    collection.fetchKeys
  );

  const paginated = [];

  for (const col of collected) {
    paginated.push(col.then(resCollection => {
      const paged = helpers.paginateRecordCollection(
        recordDef,
        resCollection,
        slice,
        cursor
      );
      helpers.linkRecordDefReference(recordDef, paged);
      paged.__pageInfo__ = {
        total: resCollection.length
      };
      return paged;
    }));
  }

  return paginated;
});

const collectionQuery = co.wrap(function * ({
  recordDef, collection, keyObjs, forGrant = false, viewerLoaders
}) {
  const query = SQL``;
  const { sort, slice, cursor } = keyObjs[0];
  const keys = keyObjs.map(ko => ko.key);
  const fieldLookup = collection.getRecordFieldsLookup();
  const tablename = collection.namespace;
  const recordKeyField = fieldLookup[recordDef.name][recordDef.canonicalKey];
  const fetchKeyField = fieldLookup[collection.fetchKey.record][collection.fetchKey.key];
  const selectFieldList = [ recordKeyField, fetchKeyField ];
  let filterQuery;

  if (collection.filters) {
    filterQuery = SQL``;
    for (const filter of collection.filters) {
      filter.record = filter.record ? filter.record : recordDef.name;
      const filterField = fieldLookup[filter.record][filter.key];
      selectFieldList.push(filterField);
      filterQuery
        .append(` AND ${ filterField } ${ filter.predicate } `);
      if (filter.value === null) {
        filterQuery.append('NULL');
      } else {
        filterQuery.append(SQL`${ filter.value }`);
      }
    }
  }

  query.append(queries.selectStatement(selectFieldList, tablename));
  query.append(` WHERE`);
  query.append(queries.whereInClause(fetchKeyField, keys));

  if (filterQuery) {
    query.append(filterQuery);
  }

  if (sort) {
    sort.record = sort.record ? sort.record : recordDef.name;
    query.append(
      ` ORDER BY ${ fieldLookup[sort.record][sort.key] } ${ sort.reverse ? 'ASC' : 'DESC' }`);
  }

  const pgResult = yield callQueryLoader(query);
  const rows = queries.parseResultIntoRows(pgResult);

  if (forGrant) {
    return marshallers.convertRowsToGrantContext(
      recordDef, rows, keys, recordKeyField, fetchKeyField);
  }

  const collected = marshallers.convertRowsToModelCollections(
    recordDef,
    viewerLoaders,
    rows,
    keys,
    recordKeyField,
    fetchKeyField
  );

  const paginated = [];

  for (const col of collected) {
    paginated.push(col.then(resCollection => {
      const paged = helpers.paginateRecordCollection(
        recordDef,
        resCollection,
        slice,
        cursor
      );
      helpers.linkRecordDefReference(recordDef, paged);
      paged.__pageInfo__ = {
        total: resCollection.length
      };
      return paged;
    }));
  }


  return paginated;
});

const all = co.wrap(function * ({ recordDef, keyObj }) {
  const query = SQL``;
  const fields = recordDef.fieldsRegular;
  const { sort, slice, cursor } = keyObj;

  query.append(
    queries.selectStatement([ recordDef.canonicalKey ], recordDef.namespace));

  if (sort) {
    query.append(
      ` ORDER BY ${ fields[sort.key] } ${ sort.reverse ? 'ASC' : 'DESC' }`);
  }

  const pgResult = yield callQueryLoader(query);
  return queries.parseResultIntoRows(pgResult);
});

const connectionCollection = co.wrap(function * ({ connectionDef, collection, keyObjs, viewerLoaders }) {
  const query = SQL``;
  const { sort, slice, cursor } = keyObjs[0];
  const tablename = connectionDef.namespace;
  const keys = keyObjs.map(ko => ko.keys);
  const keysVertical = keys[0].map(k => []);
  const fieldLookup = connectionDef.getRecordFieldsLookup();
  const recordKeyFields = connectionDef.getRecordDefs().map(rd => fieldLookup[rd.name][rd.canonicalKey]);
  const fetchKeyFields = collection.fetchKeys.map(fk => fieldLookup[fk.record][fk.key]);
  // const extraFields = Object.values(collectionDef.fields);
  const selectFieldList = new Set([
    ...recordKeyFields,
    ...fetchKeyFields
  ]);
  let filterQuery;

  keys.forEach(key => {
    key.forEach((k, idx) => {
      keysVertical[idx].push(k);
    });
  });

  if (collection.filters) {
    filterQuery = SQL``;
    for (const filter of collection.filters) {
      invariant(filter.record, 'You must specify record for connection filters!');
      const filterField = fieldLookup[filter.record][filter.key];
      selectFieldList.add(filterField);
      filterQuery
        .append(` AND ${ filterField } ${ filter.predicate } `);
      if (filter.value === null) {
        filterQuery.append('NULL');
      } else {
        filterQuery.append(SQL`${ filter.value }`);
      }
    }
  }

  query.append(queries.selectStatement([ ...selectFieldList ], tablename));
  query.append(` WHERE`);

  fetchKeyFields.forEach((fk, idx, arr) => {
    if (idx !== 0) {
      query.append(` AND`);
    }
    query.append(queries.whereInClause(fk, keysVertical[idx]));
  });

  if (filterQuery) {
    query.append(filterQuery);
  }

  if (sort) {
    invariant(sort.record, 'Must supply a sort Record for sorting connection types!');
    query.append(
      ` ORDER BY ${ fieldLookup[sort.record][sort.key] } ${ sort.reverse ? 'ASC' : 'DESC' }`);
  }

  const pgResult = yield callQueryLoader(query);
  const rows = queries.parseResultIntoRows(pgResult);

  const collected = marshallers.convertRowsToConnectionCollections(
    connectionDef,
    viewerLoaders,
    rows,
    keys,
    recordKeyFields,
    fetchKeyFields
  );

  const paginated = [];

  for (const col of collected) {
    paginated.push(col.then(resCollection => {
      const paged = helpers.paginateConnectionCollection(
        connectionDef,
        resCollection,
        slice,
        cursor
      );
      helpers.linkRecordDefReference(connectionDef, paged);
      paged.__pageInfo__ = {
        total: resCollection.length
      };
      return paged;
    }));
  }

  return paginated;
});

module.exports.canonical = canonical;
module.exports.vanity = vanity;
module.exports.collection = collectionQuery;
module.exports.collectionMulti = collectionMultiQuery;
module.exports.all = all;
module.exports.connectionCollection =  connectionCollection;
