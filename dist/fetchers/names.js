'use strict';


const camelcase = require('camelcase');

module.exports = {};

const recordVanityFetcher = (recordDef, vanityFieldName) => {
  return camelcase(`fetch by ${ vanityFieldName }`);
};

const recordCollectionFetcher = collection => {
  return camelcase(`fetch many by ${ collection.name }`);
};

const connectionCollectionFetcher = collection => {
  return camelcase(`fetch many by ${ collection.name }`);
};

module.exports.recordVanityFetcher = recordVanityFetcher;
module.exports.recordCollectionFetcher = recordCollectionFetcher;
module.exports.connectionCollectionFetcher = connectionCollectionFetcher;
