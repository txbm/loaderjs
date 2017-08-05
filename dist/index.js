const debug = require('debug')('main');
const { log } = require('./logging');
const datastores = require('./datastores/index');
const modelers = require('./modelers/index');
const helpers = require('./helpers');

process.on('unhandledRejection', function (error, p) {
  log.error(`[Unhandled Rejection] -> ${ error.stack }`);
});

debug('Booting Waldo Loader...');

module.exports = {
  RecordRegistry: modelers.recordModel.RecordModelRegistry,
  recordModel: modelers.recordModel.build,
  connectionModel: modelers.connectionModel.build,
  Datastores: datastores.Datastores,
  clearViewerState: helpers.clearViewerState,
  syncMeta: helpers.syncMeta
};
