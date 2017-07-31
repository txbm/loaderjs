const { expect } = require('chai');
const { describe, it } = require('mocha');

const queries = require('../queries');
const { assertSQL } = require('./utils');


describe('Postgres queries', () => {
  it('selectWhereInByUniqueColumn', () => {
    const vals = ['1', '2', '3'];
    const sql = queries.selectWhereInByUniqueColumn(
      'some_table',
      ['col1', 'col2'],
      'col1',
      vals
    );

    assertSQL(sql);
    expect(sql.strings.join('')).to.equal(
      'SELECT col1, col2 FROM some_table WHERE col1 IN (,,)');
    expect(sql.strings.length).to.equal(vals.length + 1);
    expect(sql.values).to.eql(vals);
  });

  it('selectWhereInManyWithFilterSort', () => {
    const vals1 = ['1', '2', '3'];
    const vals2 = ['8', '9', '10'];
    const sql = queries.selectWhereInManyWithFilterSort(
      'some_table',
      ['col1', 'col2'],
      [['col3', vals1], ['col4', vals2]]
    );

    assertSQL(sql);
    expect(sql.strings.join('')).to.equal(
      'SELECT col1, col2 FROM some_table WHERE col3 IN (,,) AND col4 IN (,,)');
    expect(sql.values).to.eql(vals1.concat(vals2));

    const sql2 = queries.selectWhereInManyWithFilterSort(
      'some_table',
      ['col1', 'col2'],
      [['col3', vals1], ['col4', vals2]],
      [['col5', '=', 'A'], ['col6', '<', 'B']],
      ['col7', true]
    );
    expect(sql2.strings.join('')).to.equal(
      'SELECT col1, col2 FROM some_table WHERE col3 IN (,,) AND col4 IN (,,) AND col5 =  AND col6 <  ORDER BY col7 ASC'
    );
    expect(sql2.values).to.eql(['1', '2', '3', '8', '9', '10', 'A', 'B']);
  });
});
