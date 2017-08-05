'use strict';

const camelcase = require('camelcase');

module.exports = {};

const recordVanityLoader = (recordDef, vanityFieldName) => {
  return camelcase(`vanity ${ recordDef.name } ${ vanityFieldName } loader`);
};

const recordCollectionLoader = (recordDef, collection) => {
  return camelcase(`many ${ recordDef.name } ${ collection.name } record loader`);
};

const recordCollectionMultiTargetLoader = (recordDef, collection) => {
  return camelcase(`many multi target ${ recordDef.name } ${ collection.name } record loader`);
};

const recordGrantContextLoader = (recordDef, collection) => {
  return camelcase(`grant ${ recordDef.name } ${ collection.name } record loader`);
};

const recordAllLoader = recordDef => {
  return camelcase(`all ${ recordDef.name } record loader`);
};

const connectionCollectionLoader = (connectionDef, collection) => {
  return camelcase(`${ connectionDef.name } ${ collection.name } connection loader`);
};

module.exports.recordVanityLoader = recordVanityLoader;
module.exports.recordCollectionLoader = recordCollectionLoader;
module.exports.recordCollectionMultiTargetLoader = recordCollectionMultiTargetLoader;
module.exports.recordGrantContextLoader = recordGrantContextLoader;
module.exports.recordAllLoader = recordAllLoader;
module.exports.connectionCollectionLoader = connectionCollectionLoader;
