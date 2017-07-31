/* @flow */

import type {
  NodeDefinition,
  NodeDefinitionP,
  NodeCanonical,
  NodeCanonicalP,
  NodeProperty,
  NodePropertyP,
  NodeRelation,
  NodeRelationP,
  NodeRelationLoaderKey
} from '../nodes/definitions';

import type {
  NodeRelationLoaderKeyInput
} from '../nodes/loaders';

export type BackendOptions = { [string]: mixed };
export type NodeQueryResult = Array<{ [string]: mixed; } | Error>;
export type VanityQueryResult = Array<string | null | Error>;
export type RelationQueryResult = Array<Array<string> | Error>;

export interface Backend {
  name: string;
  connection: { [string]: any };

  canonicalQuery(
    def: NodeDefinitionP,
    canonical: NodeCanonicalP,
    keys: string[]): Promise<NodeQueryResult>;

  vanityQuery(
    def: NodeDefinitionP,
    prop: NodePropertyP,
    keys: string[]): Promise<VanityQueryResult>;

  relationQuery(
    def: NodeDefinitionP,
    rel: NodeRelationP,
    rfks: NodeRelationLoaderKeyInput[]): Promise<RelationQueryResult>;

  preParseValidateOpts(opts: BackendOptions): true | string;
  postParseValidateOpts(opts: BackendOptions): true | string;

  parseCanonical(
    def: NodeDefinition,
    canonical: NodeCanonical): BackendOptions;

  parseProperty(
    def: NodeDefinition,
    canonicalP: NodeCanonicalP,
    prop: NodeProperty): BackendOptions;

  parseRelation(
    def: NodeDefinition,
    canonicalP: NodeCanonicalP,
    rel: NodeRelation): BackendOptions;

  parseRelationLoaderKey(
    def: NodeDefinition,
    canonicalP: NodeCanonicalP,
    rel: NodeRelation,
    lk: NodeRelationLoaderKey): BackendOptions;
};
