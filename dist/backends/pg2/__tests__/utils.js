const fs = require('fs');
const invariant = require('invariant');

const { expect } = require('chai');

const log = require('../../../logging').default;
const engine = require('../engine');

const assertSQL = (obj) => {
  expect(obj.constructor.name).equal('SQLStatement');
};

const executeFile = (pool, path) => {
  invariant(
    fs.existsSync(path),
    `${ path } not found while trying to execute SQL file.`);

  const sql = fs.readFileSync(path).toString();
  return pool.query(sql)
    .then((result) => log.debug(
      `Executed SQL ${ path } with result: ${ JSON.stringify(result) }`))
    .catch((error) => log.error(
      `Failed to execute SQL ${ path } with error ${ error }`));
};

const starWarsConnection = {
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  database: 'star_wars_test_db',
  application_name: 'graphqljs-loader'
};

const makeTestPool = () => engine.newPGPool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  database: 'postgres',
  application_name: 'graphqljs-loader'
});

const makeStarWarsPool = () => engine.newPGPool(starWarsConnection);

const dropStarWarsDb = () => {
  const pool = makeTestPool();
  return pool.query('DROP DATABASE IF EXISTS star_wars_test_db;')
   .then(result =>
     log.debug(`Dropped star wars db: ${ JSON.stringify(result) }`))
   .catch(error =>
     log.error(`Failed to drop star wars db: ${ error }`))
   .then(() => pool.end());
};

const createStarWarsDb = () => {
  const pool = makeTestPool();
  return pool.query('CREATE DATABASE star_wars_test_db;')
   .then(result =>
     log.debug(`Created star wars db: ${ JSON.stringify(result) }`))
   .catch(error =>
     log.error(`Failed to drop star wars db: ${ error }`))
   .then(() => pool.end());
};

const installStarWarsDb = () => {
  const pool = makeStarWarsPool();
  return executeFile(pool, 'src/__tests__/fixtures/postgres-fixtures.sql')
         .then(() => pool.end());
};

const setupTeardownStarWarsDb = () => (
  dropStarWarsDb()
 .then(createStarWarsDb)
 .then(installStarWarsDb));

Object.assign(exports, {
  assertSQL,
  executeFile,
  makeTestPool,
  makeStarWarsPool,
  setupTeardownStarWarsDb,
  starWarsConnection
});
