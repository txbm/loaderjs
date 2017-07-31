/* @flow */

const invariant = require('invariant');
const Promise = require('bluebird');
const debug = require('debug')('loader:postgres');
const shortid = require('shortid');
const pg = require('pg');

const log = require('../../logging');

import type {
  SQLTemplateString
} from './clauses';

export type PGConnection = {
  user: string;
  password: string;
  host: string;
  database: string;
  max: number;
  idleTimeoutMillis: number;
  application_name: string;
};

export type PGPool = typeof pg.Pool;
export type PGQueryResult = Promise<mixed[]>;

// const pgPool = new pg.Pool({
//   user: process.env.WALDO_CORE_DATA_PG_USER || 'dev',
//   password: process.env.WALDO_CORE_DATA_PG_PASS || '1234',
//   host: process.env.WALDO_CORE_DATA_PG_HOST || 'localhost',
//   database: process.env.WALDO_CORE_DATA_PG_DB || 'waldo-dev',
//   max: 75,
//   idleTimeoutMillis: 1000,
//   application_name: 'waldo-loader'
// });

const newPGPool = (conn: PGConnection): PGPool => {
  const pool = new pg.Pool(conn);
  // @TODO clean this up
  pool.on('error', (error, client) => {
    log.error(`[PG Pool Error] -> ${ error }`);
  });
  return pool;
};

const runTemplatedQuery = Promise.coroutine(function * (
  pgPool: PGPool,
  query: SQLTemplateString
) {
  invariant(
    query.constructor.name === 'SQLStatement',
    `The runTemplatedQuery function only accepts SQLStatement objects generated
     from sql-template-strings. Got ${ query } instead.`);
  let result = null;
  const queryId = shortid.generate();
  try {
    debug(`[executing] ${ queryId } : ${ query.strings }`);
    result = yield pgPool.query(query);
    debug(`[finished] -> ${ queryId }`);
  } catch (error) {
    log.error(`[PG Query ERROR] -> ${ queryId } : ${ query.strings } \n ${ error.stack }`);
    error.queryId = queryId;
    throw error;
  }
  return result;
});


Object.assign(exports, {
  newPGPool,
  runTemplatedQuery
});
