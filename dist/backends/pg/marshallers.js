'use strict';

module.exports = {};

const helpers = require('../../helpers');

const convertRowsToModels = (
  recordDef, rows, keys, rowKey
) => {
  const keyedRows = {};
  const result = [];

  for (const row of rows) {
    keyedRows[row[rowKey]] = row;
    helpers.linkRecordDefReference(recordDef, row);
  }

  for (const key of keys) {
    if (keyedRows[key]) {
      keyedRows[key].__cursor__ = result.length + 1;
    }
    result.push(keyedRows[key] || null);
  }

  return result;
};

const convertRowsToModelCollections = (
  recordDef, viewerLoaders, rows, keys, recordKeyField, fetchKeyField
) => {
  const groupedRows = {};
  const result = [];
  const recordLoaders = viewerLoaders.records.get(recordDef);

  if (rows) {
    for (const row of rows) {
      if (!groupedRows[row[fetchKeyField]]) {
        groupedRows[row[fetchKeyField]] = [];
        helpers.linkRecordDefReference(recordDef, groupedRows[row[fetchKeyField]]);
      }
      const cursor = groupedRows[row[fetchKeyField]].length + 1;

      if (row && row[recordKeyField]) {
        groupedRows[row[fetchKeyField]].push(recordLoaders.canonical.load(row[recordKeyField]).then(loaded => {
          loaded.__cursor__ = cursor;
          return loaded;
        }));
      }
    }
  }

  for (const key of keys) {
    if (groupedRows[key] && groupedRows[key].length > 0) {
      result.push(Promise.all(groupedRows[key]));
    } else {
      const empty = [];
      helpers.linkRecordDefReference(recordDef, empty);
      result.push(Promise.resolve(empty));
    }
  }

  return result;
};

const convertRowsToMultiTargetModelCollections = (
  recordDef, viewerLoaders, rows, keys, rowKey, fetchKeyFields, fetchKeys
) => {
  const groupedRows = {};
  const result = [];
  const recordLoaders = viewerLoaders.records.get(recordDef);

  for (const row of rows) {
    const fetchCompoundKey = fetchKeyFields.reduce((p, c) => {
      return p.concat(row[c]);
    }, []).join('-');

    if (!groupedRows[fetchCompoundKey]) {
      groupedRows[fetchCompoundKey] = [];
      helpers.linkRecordDefReference(recordDef, groupedRows[fetchCompoundKey]);
    }

    const cursor = groupedRows[fetchCompoundKey].length + 1;
    groupedRows[fetchCompoundKey].push(recordLoaders.canonical.load(row[rowKey]).then(loaded => {
      if (loaded) {
        loaded.__cursor__ = cursor;
      }
      return loaded;
    }));
  }

  for (const key of keys) {
    const compound = key.join('-');
    if (groupedRows[compound]) {
      result.push(Promise.all(groupedRows[compound]));
    } else {
      const empty = [];
      helpers.linkRecordDefReference(recordDef, empty);
      result.push(Promise.resolve(empty));
    }
  }

  return result;
};

const convertRowsToGrantContext = (
  recordDef, rows, keys, recordKeyField, fetchKeyField
) => {
  const groupedRows = {};
  const result = [];

  for (const row of rows) {
    if (!groupedRows[row[fetchKeyField]]) {
      groupedRows[row[fetchKeyField]] = new Set();
    }
    groupedRows[row[fetchKeyField]].add(row[recordKeyField]);
  }

  for (const key of keys) {
    result.push(groupedRows[key] || new Set());
  }

  return result;
};

const convertRowsToConnectionCollections = (
  connectionDef,
  viewerLoaders,
  rows,
  keys,
  recordKeyFields,
  fetchKeyFields
) => {
  const groupedRows = {};
  const result = [];
  const recordDefs = connectionDef.getRecordDefs();
  const recordLoadersLookup = {};

  for (const recordDef of recordDefs) {
    recordLoadersLookup[recordDef.fieldsPrefixed[recordDef.canonicalKey]] = viewerLoaders.records.get(recordDef);
  }

  for (const row of rows) {
    const fetchCompoundKey = fetchKeyFields.reduce((p, c) => {
      return p.concat(row[c]);
    }, []).join('-');

    if (!groupedRows[fetchCompoundKey]) {
      groupedRows[fetchCompoundKey] = [];
      helpers.linkConnectionDefReference(connectionDef, groupedRows[fetchCompoundKey]);
    }

    const resolution = new Promise((res, rej) => {
      const hydrated = {};
      const promises = [];

      helpers.linkConnectionDefReference(connectionDef, hydrated);

      for (const recordDef of recordDefs) {
        promises.push(viewerLoaders.records.get(recordDef).canonical.load(
          row[recordDef.fieldsPrefixed[recordDef.canonicalKey]]
        ));
      }

      return Promise.all(promises).then(values => {
        values.forEach((val, idx) => {
          hydrated[recordDefs[idx].name.toLowerCase()] = val;
        });
        return res(hydrated);
      });
    });

    groupedRows[fetchCompoundKey].push(resolution);
  }

  for (const key of keys) {
    const compound = key.join('-');
    if (groupedRows[compound]) {
      result.push(Promise.all(groupedRows[compound]).then(group => {
        helpers.linkConnectionDefReference(connectionDef, group);
        return group;
      }));
    } else {
      const empty = [];
      helpers.linkConnectionDefReference(connectionDef, empty);
      result.push(Promise.resolve(empty));
    }
  }

  return result;
};

module.exports.convertRowsToModels = convertRowsToModels;
module.exports.convertRowsToModelCollections = convertRowsToModelCollections;
module.exports.convertRowsToMultiTargetModelCollections = convertRowsToMultiTargetModelCollections;
module.exports.convertRowsToGrantContext = convertRowsToGrantContext;
module.exports.convertRowsToConnectionCollections = convertRowsToConnectionCollections;
