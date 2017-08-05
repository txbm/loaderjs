const SimpleNode = {
  name: 'SimpleTestNode',
  datastoreName: 'pretendPG',
  namespace: 'simple_test_nodes',
  properties: {
    node_id: {
      canonical: true
    },
    node_prop_1: {},
    node_vanity_prop_1: {
      vanity: true
    },
    node_prop_diff_ds: {
      datastore: 'pretendPG2'
    }
  }
};

const InvalidNode1 = Object.assign({}, SimpleNode, {
  name: null
});

const InvalidNode2 = Object.assign({}, SimpleNode, {
  datastoreName: null
});

const InvalidNode3 = Object.assign({}, SimpleNode, {
  namespace: null
});

const InvalidNode4 = Object.assign({}, SimpleNode, {
  properties: {}
});

const InvalidNode5 = Object.assign({}, SimpleNode, {
  properties: {
    node_id: { canonical: false }
  }
});

const InvalidNode6 = Object.assign({}, SimpleNode, {
  properties: {
    node_id: { canonical: true },
    node_id_2: { canonical: true }
  }
});

const ComplexNode = {
  name: 'ComplexNode',
  datastoreName: 'pretendPG',
  namespace: 'complex_nodes',
  properties: {
    id: { canonical: true },
    username: { vanity: true },
    data1: {},
    data2: {}
  },
  relations: [
    {
      name: 'relation1',
      namespace: 'complex_and_simple_nodes',
      fetchKeys: [
        { nodeName: 'RelatedNode', propName: 'complex_nodes_id' }
      ]
    },
    {
      name: 'relation2',
      fetchKeys: [ { nodeName: 'ComplexNode', propName: 'data1' } ]
    },
    {
      name: 'relation3',
      fetchKeys: [
        { nodeName: 'ComplexNode', propName: 'data1' },
        { nodeName: 'ComplexNode', propName: 'data2' }
      ]
    }
  ]
};

const RelatedNode = {
  name: 'RelatedNode',
  datastoreName: 'pretendPG',
  namespace: 'related_nodes',
  properties: {
    id: { canonical: true },
    some_field: { vanity: true },
    complex_nodes_id: {}
  }
};

const RogueNode = {
  name: 'RogueNode',
  datastoreName: 'pretendPG',
  namespace: 'rogue_nodes',
  properties: {
    id: { canonical: true }
  },
  relations: [
    {
      name: 'relation1',
      namespace: 'some_namespace',
      fetchKeys: [
        { nodeName: 'NonExistentNode', propName: 'some_fucking_prop' }
      ]
    }
  ]
};

const ValidComplexNode1 = Object.assign({}, ComplexNode, {
  relations: [
    {
      name: 'relation1',
      fetchKeys: [
        { nodeName: 'RelatedNode', propName: 'complex_nodes_id' }
      ]
    }
  ]
});

const InvalidComplexNode1 = Object.assign({}, ComplexNode, {
  relations: [
    {
      namespace: 'complex_and_simple_nodes',
      fetchKeys: [
        { nodeName: 'RelatedNode', propName: 'complex_nodes_id' }
      ]
    }
  ]
});

const InvalidComplexNode2 = Object.assign({}, ComplexNode, {
  relations: [
    {
      name: 'relation1',
      namespace: 'complex_and_simple_nodes'
    }
  ]
});

const InvalidComplexNode3 = Object.assign({}, ComplexNode, {
  relations: [
    {
      name: 'relation1',
      namespace: 'complex_and_simple_nodes',
      fetchKeys: [
        { propName: 'complex_nodes_id' }
      ]
    }
  ]
});

const InvalidComplexNode4 = Object.assign({}, ComplexNode, {
  relations: [
    {
      name: 'relation1',
      namespace: 'complex_and_simple_nodes',
      fetchKeys: [
        { nodeName: 'RelatedNode'  }
      ]
    }
  ]
});


Object.assign(exports, {
  SimpleNode,
  InvalidNode1,
  InvalidNode2,
  InvalidNode3,
  InvalidNode4,
  InvalidNode5,
  InvalidNode6,
  ComplexNode,
  RelatedNode,
  RogueNode,
  ValidComplexNode1,
  InvalidComplexNode1,
  InvalidComplexNode2,
  InvalidComplexNode3,
  InvalidComplexNode4
});
