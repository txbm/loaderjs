const { expect } = require('chai');
const { describe, it } = require('mocha');

const definitions = require('../definitions');
const fixtures = require('../../__tests__/fixtures/node-definitions');

describe('Simple invalid node definitions', () => {
  it('fail to parse and validate', () => {
    expect(() => definitions.parseAndValidateNodeDefinition(fixtures.InvalidNode1))
    .to.throw(Error, 'required name');

    expect(() => definitions.parseAndValidateNodeDefinition(fixtures.InvalidNode2))
    .to.throw(Error, 'required datastore');

    expect(() => definitions.parseAndValidateNodeDefinition(fixtures.InvalidNode3))
    .to.throw(Error, 'required namespace');

    expect(() => definitions.parseAndValidateNodeDefinition(fixtures.InvalidNode4))
    .to.throw(Error, 'at least one (canonical)');

    expect(() => definitions.parseAndValidateNodeDefinition(fixtures.InvalidNode5))
    .to.throw(Error, 'No canonical property was found');

    expect(() => definitions.parseAndValidateNodeDefinition(fixtures.InvalidNode6))
    .to.throw(Error, 'more than one canonical property');
  });
});

describe('Complex invalid node definitions', () => {
  it('fail to parse and validate', () => {

    expect(
      () => definitions.parseAndValidateNodeDefinition(
        fixtures.InvalidComplexNode1)).to.throw(Error, 'required name field');

    expect(
      () => definitions.parseAndValidateNodeDefinition(
        fixtures.InvalidComplexNode2)).to.throw(Error, 'one fetch key is required');

    expect(
      () => definitions.parseAndValidateNodeDefinition(
        fixtures.InvalidComplexNode3)).to.throw(Error, 'Must specify a nodeName');

    expect(
      () => definitions.parseAndValidateNodeDefinition(
        fixtures.InvalidComplexNode4)).to.throw(Error, 'Must specify a propName');

  });
});
