const { expect } = require('chai');
const {
  describe,
  it,
  beforeEach,
  afterEach
} = require('mocha');

const fixtures = require('../../../__tests__/fixtures/node-definitions');
const defs = require('../../../nodes/definitions');
const converters = require('../converters');

describe('The PG data structure converters', () => {
  beforeEach(() => {
    defs.NodeDefinitionRegistry.register(
      defs.parseAndValidateNodeDefinition(fixtures.ComplexNode));
    defs.NodeDefinitionRegistry.register(
      defs.parseAndValidateNodeDefinition(fixtures.RelatedNode));
  });

  afterEach(() => {
    defs.NodeDefinitionRegistry.wipe();
  });

  it('can dynamically select prop lookup strategies', () => {
    const cNode = defs.NodeDefinitionRegistry.lookup('ComplexNode');
    const cLookup = converters.getPropLookupMap(cNode, cNode.relations[0]);
    expect(cLookup).to.have.keys(['ComplexNode', 'RelatedNode']);
    expect(cLookup.ComplexNode).to.have.keys(Object.keys(
      fixtures.ComplexNode.properties));
    expect(cLookup.ComplexNode.id).to.equal(
      `${ fixtures.ComplexNode.namespace }_id`);
  });

  it('can build columns for a relationship query', () => {
    const cNode = defs.NodeDefinitionRegistry.lookup('ComplexNode');
    const rNode = defs.NodeDefinitionRegistry.lookup('RelatedNode');

    const cols = converters.buildRelationQueryColumns(
      cNode,
      cNode.relations[0]);

    expect(cols).to.eql([
      `${ cNode.namespace }_id`,
      `${ rNode.namespace }_complex_nodes_id`]);

    const cols2 = converters.buildRelationQueryColumns(
      cNode,
      cNode.relations[1]);

    expect(cols2).to.eql(['id', 'data1']);
  });

  it('can build query keys for a relationship query', () => {
    const cNode = defs.NodeDefinitionRegistry.lookup('ComplexNode');
    const rNode = defs.NodeDefinitionRegistry.lookup('RelatedNode');
    const k = ['1'];
    const k2 = ['1'];
    const k3 = ['1', '2'];
    const k4 = ['5', '4'];

    const keys = converters.buildRelationQueryKeys(
      cNode,
      cNode.relations[0],
      [{ keys: k }]
    );

    expect(keys[0][0]).to.equal('related_nodes_complex_nodes_id');
    expect(keys[0][1]).to.eql(k);

    const keys2 = converters.buildRelationQueryKeys(
      cNode,
      cNode.relations[0],
      [{ keys: k }, { keys: k2 }]
    );

    expect(keys2[0][1]).eql(k.concat(k2));

    expect(() => converters.buildRelationQueryKeys(
      cNode,
      cNode.relations[0],
      [{ keys: ['1', '2'] }]
    )).to.throw(Error, 'does not match relation definition');

    const keys3 = converters.buildRelationQueryKeys(
      cNode,
      cNode.relations[2],
      [{ keys: k3 }]
    );

    expect(keys3[0][0]).to.equal('data1');
    expect(keys3[0][1]).to.eql(['1']);
    expect(keys3[1][0]).to.equal('data2');
    expect(keys3[1][1]).to.eql(['2']);

    const keys4 = converters.buildRelationQueryKeys(
      cNode,
      cNode.relations[2],
      [ { keys: k3 }, { keys: k4 } ]
    );

    expect(keys4[0][0]).to.equal('data1');
    expect(keys4[0][1]).to.eql(['1', '5']);
    expect(keys4[1][0]).to.equal('data2');
    expect(keys4[1][1]).to.eql(['2', '4']);
  });

  it('can group and sort row results from a relation query back to the loader', () => {
    const cNode = defs.NodeDefinitionRegistry.lookup('ComplexNode');
    const rNode = defs.NodeDefinitionRegistry.lookup('RelatedNode');

    const rfks = [
      { keys: ['1', '2'] },
      { keys: ['10', '9'] },
      { keys: ['5', '4'] }
    ];

    const rows = [
      { id: '100', data1: '1', data2: '2' },
      { id: '101', data1: '5', data2: '4' }
    ];

    const res = converters.groupAndSortRelationRows(
      cNode,
      cNode.relations[2],
      rfks,
      rows
    );

    expect(res[0]).to.eql(['100']);
    expect(res[1]).to.be.null;
    expect(res[2]).to.eql(['101']);
  });
});
