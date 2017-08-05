/*       */

const { expect } = require('chai');
const { describe, it } = require('mocha');

const definitions = require('../definitions');
const fixtures = require('../../__tests__/fixtures/star-wars-definitions');

describe('Simple valid node definitions', () => {
  it('parse and validate', () => {
    const def = fixtures.SimpleNode;

    expect(() => definitions.parseAndValidateNodeDefinition(fixtures.SimpleNode))
    .to.not.throw();
  });

  it('can be registered and retrieved by name', () => {
    const ndr = definitions.NodeDefinitionRegistry;
    const parsed = definitions.parseAndValidateNodeDefinition(fixtures.SimpleNode);

    ndr.register(parsed);
    expect(ndr.lookup(fixtures.SimpleNode.name)).to.equal(parsed);

    expect(() => ndr.lookup('DoesntExist')).to.throw();
  });
});

describe('Complex node definitions', () => {
  it('parse and validate', () => {

    expect(
      () => definitions.parseAndValidateNodeDefinition(
        fixtures.ValidComplexNode1)).to.not.throw();
  });

  it('run integrity checks', () => {
    const ndr = definitions.NodeDefinitionRegistry;
    const cNode = fixtures.ComplexNode;
    const rNode = fixtures.RelatedNode;
    const rgNode = fixtures.RogueNode;

    const cParsed = definitions.parseAndValidateNodeDefinition(cNode);
    const rParsed = definitions.parseAndValidateNodeDefinition(rNode);
    const rgParsed = definitions.parseAndValidateNodeDefinition(rgNode);

    ndr.register(cParsed);
    ndr.register(rParsed);

    expect(definitions.integrityCheck()).to.equal(true);

    ndr.register(rgParsed);

    expect(() => definitions.integrityCheck()).to.throw(
      Error, 'in registry for relation');
  });
});
