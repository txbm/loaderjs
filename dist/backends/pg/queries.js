'use strict';

const debug = require('debug')('main');
const Log = require('log');
const log = new Log('debug');
const DataLoader = require('dataloader');
const co = require('co');
const pg = require('pg');
const SQL = require('sql-template-strings');
const shortid = require('shortid');

const pgPool = new pg.Pool({
  user: process.env.WALDO_CORE_DATA_PG_USER || 'dev',
  password: process.env.WALDO_CORE_DATA_PG_PASS || '1234',
  host: process.env.WALDO_CORE_DATA_PG_HOST || 'localhost',
  database: process.env.WALDO_CORE_DATA_PG_DB || 'waldo-dev',
  max: 75,
  idleTimeoutMillis: 1000,
  application_name: 'waldo-loader'
});

pgPool.on('error', (error, client) => {
  log.error(`[PG Pool Error] -> ${ error }`);
});

const selectStatement = (fields, table) => {
  return SQL` SELECT `.append(fields.join(', ')).append(` FROM `).append(table);
};

const subSelectStatement = (fields, table, partitionKey, sort = null) => {
  if (fields.indexOf(partitionKey) < 0) fields.push(partitionKey);

  const q = SQL` SELECT `
    .append(fields.join(', '))
    .append(` FROM (SELECT ROW_NUMBER() OVER (PARTITION BY ${ partitionKey }`);

  if (sort) {
    q.append(` ORDER BY ${ sort.key } ${ sort.reverse ? 'ASC' : 'DESC' }`);
  }

  q.append(`) AS rn, ${ fields.join(', ') } FROM ${ table }) sq`);

  return q;
};

const whereInClause = (key, values) => {
  const q = SQL``.append(` ${ key } IN (`);
  let idx = 0;
  for (const v of values) {
    if (idx === values.length - 1) {
      q.append(SQL`${ v }`);
    } else {
      q.append(SQL`${ v },`);
    }
    idx += 1;
  }
  q.append(`)`);
  return q;
};

const commonTableExpression = (fields, table, conditions = null) => {
  const q = SQL``.append(`WITH ${ table } AS (`);
  q.append(pgSelect(fields, table));

  if (conditions) {
    q.append(conditions);
  }

  q.append(`)`);
  return q;
};

const parseResultIntoRows = (result = null, takeOne = false) => {

  if (result) {
    const { command, rowCount, rows } = result;
    if (command === 'SELECT') {
      if (rowCount === 0) return [];
      if (takeOne) return rows[0];
      return rows;
    }
  }

  return result;
};

const runQueriesInTransaction = co.wrap(function * (queries) {
  const client = yield pgPool.connect();
  let results = null;
  const queryId = shortid.generate();

  try {
    debug(`[PG Query RUNNING] -> ${ queryId } : ${ queries.map(q => q.strings).join(', \n ') }`);
    yield client.query('BEGIN');
    results = yield Promise.all(queries.map(q => client.query(q)));
    yield client.query('COMMIT');
    client.release();
    debug(`[PG Query DONE] -> ${ queryId }`);
  } catch (error) {
    client.release(true);
    log.error(`[PG Query ERROR] -> ${ queryId } : ${ error }`);
    error.queryId = queryId;
    throw error;
  }

  return results;
});

const runQuery = co.wrap(function * (query) {
  let result = null;
  const queryId = shortid.generate();
  try {
    debug(`[PG Query RUNNING] -> ${ queryId } : ${ query.strings }`);
    result = yield pgPool.query(query);
    debug(`[PG Query DONE] -> ${ queryId }`);
  } catch (error) {
    log.error(`[PG Query ERROR] -> ${ queryId } : ${ error.stack }`);
    log.error(`[PG Query ERROR] -> ${ queryId } : For query: ${ query.strings }`);
    error.queryId = queryId;
    throw error;
  }
  return result;
});

const queryLoader = new DataLoader(
  queries => Promise.all(
    queries.map(q => runQuery(q)))
    .catch(e => { throw e; }),
  { cache: false });


module.exports = {
  queryLoader,
  runQuery,
  runQueriesInTransaction,
  parseResultIntoRows,
  commonTableExpression,
  whereInClause,
  selectStatement
};
