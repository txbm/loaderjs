/* @flow */

const Promise = require('bluebird');
const invariant = require('invariant');
const DataLoader = require('dataloader').default;
const lib = require('../lib');
const {
  BackendRegistry
} = require('../backends/registry');


import type {
  NodeQueryResult,
  VanityQueryResult,
  RelationQueryResult
} from '../backends/interface';

import type {
  NodeDefinitionP,
  NodePropertyP,
  NodeRelationP
} from './definitions';

/* Canonical Node Loading */

export type NodeLoaderKeyInput = string;
export type NodeLoader<K: NodeLoaderKeyInput, V: NodeQueryResult> = DataLoader<K, V>;

type NodeLoaderBuilder = (
  def: NodeDefinitionP
) => NodeLoader<NodeLoaderKeyInput, Promise<NodeQueryResult>>;

const buildNodeLoader: NodeLoaderBuilder = (def) => (
  new DataLoader((keys: NodeLoaderKeyInput[]) => {
    return BackendRegistry.lookup(def.canonical.backendName).canonicalQuery(
      def,
      def.canonical,
      keys
    );
  })
);

/* Vanity Node Loading */

export type VanityLoaderKeyInput = string;
export type VanityLoader<K: VanityLoaderKeyInput, V: VanityQueryResult> = DataLoader<K, V>;

type VanityLoaderBuilder = (
  def: NodeDefinitionP,
  prop: NodePropertyP
) => VanityLoader<VanityLoaderKeyInput, Promise<VanityQueryResult>>;

const buildVanityLoader: VanityLoaderBuilder = (def, prop) => (
  new DataLoader((keys: VanityLoaderKeyInput[]) => {
    return BackendRegistry.lookup(prop.backendName).vanityQuery(
      def,
      prop,
      keys
    );
  })
);

/* Node Relationship Loading */

export type NodeRelationLoaderSlicer = {
  limit?: number;
  offset?: number;
};

export type NodeRelationLoaderCursor = {
  before?: string;
  after?: string;
  first?: number;
  last?: number;
};

export type NodeRelationLoaderSort = {
  key: string;
  reverse?: boolean;
};

export type NodeRelationLoaderOpts = {
  slice?: NodeRelationLoaderSlicer;
  cursor?: NodeRelationLoaderCursor;
  sort?: NodeRelationLoaderSort;
};

export type NodeRelationLoaderKeyInput = NodeRelationLoaderOpts & { keys: NodeLoaderKeyInput[] };

export type NodeRelationLoader<K: NodeRelationLoaderKeyInput, V: RelationQueryResult> = DataLoader<K, V>;

type RelationLoaderBuilder = (
  def: NodeDefinitionP,
  rel: NodeRelationP
) => NodeRelationLoader<NodeRelationLoaderKeyInput, Promise<RelationQueryResult>>;

const buildRelationLoader: RelationLoaderBuilder = (def, rel) => (
  new DataLoader((rfks: NodeRelationLoaderKeyInput[]) => {
    return BackendRegistry.lookup(rel.backendName).relationQuery(
      def,
      rel,
      rfks
    );
  })
);

Object.assign(exports, {
  buildNodeLoader,
  buildRelationLoader
});

// const makePrefixedFieldName = (
//   recordDef: NodeDefinition,
//   fieldName: string
// ) => `${ recordDef.namespace.toLowerCase() }_${ fieldName.toLowerCase() }`;
//
// const makeRecordPrefixedFieldName = (
//   recordDef: NodeDefinition,
//   fieldName: string
// ) => `${ recordDef.name.toLowerCase() }_${ fieldName.toLowerCase() }`;

// const _canonicalFetcher = (
//   def: NodeDefinition): NodeCanonicalFetcher => {};
//
// const _vanityFetchers = (
//   props: NodeDefinitionProperties): NodeVanityFetchers => {};
//
// const _allFetcher = (
//   def: NodeDefinition): NodeAllFetcher => {};
//
// const _relationFetchers = (
//   rels?: NodeRelationDefinition[]): NodeRelationFetchers => {};

// const buildNode = (def: NodeDefinition): Node => ({
//   fetch: _canonicalFetcher(def),
//   fetchBy: _vanityFetchers(def.properties),
//   fetchAll: _allFetcher(def),
//   fetchRel: _relationFetchers(def.relations),
//   definition: def
// });

  // fetchers.builders.makeAllRecordFetcher(recordDef),
  // fetchers.builders.makeCanonicalRecordFetcher(recordDef),
  // recordDef.fieldsPrefixed = {};
  // recordDef.fieldsSingularPrefixed = {};
  // recordDef.fieldsRegular = {};
  // recordDef.collections = recordDef.collections ? recordDef.collections : [];

  // for (const fieldName in recordDef.fields) {
  //   const field = recordDef.fields[fieldName];
  //   if (field.canonical) {
  //     recordDef.canonicalKey = fieldName;
  //   }
  //
  //   if (field.vanity) {
  //     recordDef.methods[fetchers.names.recordVanityFetcher(recordDef, fieldName)] = fetchers.builders.makeVanityRecordFetcher(recordDef, fieldName);
  //   }
  //
  //   recordDef.fieldsPrefixed[fieldName] = makePrefixedFieldName(recordDef, fieldName);
  //   recordDef.fieldsSingularPrefixed[fieldName] = makeRecordPrefixedFieldName(recordDef, fieldName);
  //   recordDef.fieldsRegular[fieldName] = fieldName;
  // }

  // authorization.buildGrants(recordDef);
  // fetchers.builders.buildRecordCollectionFetchers(recordDef);

  // recordDef.methods.primeGrantContexts = (viewer) => {
  //   const fetchers = [];
  //   for (const grantContextName in recordDef.grantContexts) {
  //     const fetcher = recordDef.grantContexts[grantContextName];
  //     fetchers.push(fetcher(viewer));
  //   }
  //   return fetchers;
  // };

  // RecordModelRegistry.register(recordDef.name, recordDef);

  // const obj = Object.assign({}, recordDef.methods);
  // for (const mName in obj) {
  //   const m = obj[mName];
  //   if (!mName.startsWith('__')) {
  //     m.__name__ = recordDef.name;
  //   }
  // }
  // return obj;
// };

// exports.build = build;
// exports.RecordModelRegistry = RecordModelRegistry;
