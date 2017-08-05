const chai = require('chai');
const chaiPromise = require('chai-as-promised');
chai.use(chaiPromise);
const { expect } = require('chai');
const { describe, it } = require('mocha');

const SQL = require('sql-template-strings');

const utils = require('./utils');
const engine = require('../engine');

describe('The PG engine', () => {

  it('builds a connection pool that works', (done) => {
    const pool = utils.makeTestPool();

    expect(pool.constructor.name).to.equal('BoundPool');

    const testQuery = 'SELECT 1 AS test_result;';

    pool.query(testQuery).then(result => {
      expect(result.rowCount).to.equal(1);
      expect(result.command).to.equal('SELECT');
      expect(result.rows[0]).to.eql({ test_result: 1 });
      done();
    });
  });

  it('runs templated queries and handles errors, given a pool', () => {
    const pool = utils.makeTestPool();

    const testQuery1 = SQL`SELECT 1 AS test;`;
    const testQuery2 = SQL`THIS IS NOT VALID SQL LOL;`;

    return Promise.all([
      expect(engine.runTemplatedQuery(pool, testQuery1)).to.be.fulfilled,
      expect(engine.runTemplatedQuery(pool, testQuery2)).to.be.rejected
    ]);
  });
});
