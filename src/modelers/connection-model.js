'use strict';

const fetchers = require('../fetchers/index');
const recordModel = require('./record-model');

const ConnectionModelRegistry = {
  _registry: new Map(),
  get (connectionName) {
    if (!this._registry.has(connectionName)) {
      throw new Error(
        `[Loader Error] -> Connection model registry does not have ${ connectionName }. You must define using connectionModel().`);
    }
    return this._registry.get(connectionName);
  },
  register (connectionName, connectionDef) {
    this._registry.set(connectionName, connectionDef);
  }
};

const makePrefixedFieldName = (connectionDef, fieldName) => {
  return `${ connectionDef.namespace.toLowerCase() }_${ fieldName.toLowerCase() }`;
};

const build = connectionDef => {
  connectionDef.methods = {};

  connectionDef.getRecordDefs = () => connectionDef.connects.map(
    c => recordModel.RecordModelRegistry.get(c));

  connectionDef.getRecordFieldsLookup = () => connectionDef.getRecordDefs().reduce(
    (p, c) => {
      p[c.name] = c.fieldsPrefixed;
      return p;
    }, {});

  connectionDef.getRecordFieldsList = () => connectionDef.getRecordDefs().reduce(
    (p, c) => p.concat(Object.values(c.fieldsPrefixed)), []);

  connectionDef.methods = Object.assign(
    connectionDef.methods,
    fetchers.builders.buildConnectionCollectionFetchers(connectionDef)
  );

  connectionDef.fieldsRegular = {};
  connectionDef.fieldsPrefixed = {};
  for (const fieldName in connectionDef.extra_fields) {
    connectionDef.fieldsRegular[fieldName] = fieldName;
    connectionDef.fieldsPrefixed[fieldName] = makePrefixedFieldName(connectionDef, fieldName);
  }

  ConnectionModelRegistry.register(connectionDef.name, connectionDef);

  return connectionDef.methods;
};

exports.build = build;
exports.ConnectionModelRegistry = ConnectionModelRegistry;
