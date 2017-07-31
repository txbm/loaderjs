const { expect } = require('chai');
const {
  describe,
  it,
  beforeEach
} = require('mocha');

const fixtures = require('../../../__tests__/fixtures/node-definitions');

const {
  starWarsConnection,
  setupTeardownStarWarsDb
} = require('./utils');

const Postgres = require('../impl').default;

describe('The PG datastore implementation', () => {
  beforeEach(() => setupTeardownStarWarsDb());

  it('can instantiate and is valid', () => {
    const pg = new Postgres(
      'mah_pg',
      starWarsConnection);

    expect(pg.constructor.name).to.equal('Postgres');
    expect(Object.keys(pg)).to.eql(['name', 'connection', 'pool']);
    expect(
      () => new Postgres(null, {})).to.throw(
        Error, 'backend name is required');
    expect(
      () => new Postgres('mah_pg', null).to.throw(
        Error, 'connection configuration object is required'));
    expect(
      () => new Postgres('mah_pg', {}).to.throw(
        Error, 'Invalid Postgres connection object'));
  });

  it('can execute node queries', () => {
    const pg = new Postgres(
      'mah_pg',
      starWarsConnection);

    const sNode =
  });
});
