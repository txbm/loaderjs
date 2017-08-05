const { expect } = require('chai');
const { describe, it } = require('mocha');

const clauses = require('../clauses');
const { assertSQL } = require('./utils');

describe('Basic Postgres clauses', () => {
  it('select statement', () => {
    const sql = clauses.selectStatement(['field1', 'field2'], 'some_table');
    assertSQL(sql);
    expect(sql.strings.join('')).to.equal('SELECT field1, field2 FROM some_table');
    expect(sql.values).to.be.empty;
  });

  it('sub select statement', () => {
    const sql = clauses.subSelectStatement(
      ['field1', 'field2'],
      'some_table',
      'field1',
      { key: 'field2', reverse: true }
    );

    assertSQL(sql);
    expect(sql.strings.join('')).to.equal(
      'SELECT field1, field2 FROM (SELECT ROW_NUMBER() OVER (PARTITION BY field1 ORDER BY field2 ASC) AS rn, field1, field2 FROM some_table) sq'
    );
    expect(sql.values).to.be.empty;

    const sql2 = clauses.subSelectStatement(
      ['field1', 'field2'],
      'some_table',
      'field1'
    );

    assertSQL(sql2);
    expect(sql2.strings.join('')).to.equal(
      'SELECT field1, field2 FROM (SELECT ROW_NUMBER() OVER (PARTITION BY field1) AS rn, field1, field2 FROM some_table) sq'
    );
    expect(sql2.values).to.be.empty;
  });

  it('where in clause', () => {
    const vals = [1, 2, 3, 4, 5];
    const sql = clauses.whereInClause('field1', vals);
    expect(sql.strings.join('')).to.equal(' field1 IN (,,,,)');
    expect(sql.values).to.eql(vals);
  });
});
