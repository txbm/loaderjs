/* @flow */

const invariant = require('invariant');

const {
  NodeDefinitionRegistry
} = require('../../nodes/definitions');

import type {
  NodeDefinitionP,
  NodeRelationP
} from '../../nodes/definitions';

import type {
  NodeRelationLoaderKeyInput
} from '../../nodes/loaders';

import type {
  PostgresBackendOptions
} from './types';

// const getPropLookupMap = (
//   def: NodeDefinitionP,
//   rel: NodeRelationP
// ): { [string]: { [string]: string } } => {
//   const lookupObj = {};
//   const nodeNames = [def.name].concat(rel.loaderKeys.map(fk => fk.node));
//
//   let propNameStrategy = 'propNamesLookup';
//   if (rel.namespace !== def.namespace) {
//     propNameStrategy = 'propNamesLookupNSPrefixed';
//   }
//   // @TODO Determine future of withRecord support/operation.
//
//   for (let i = 0; i < nodeNames.length; i++) {
//     const nn = nodeNames[i];
//     const node = NodeDefinitionRegistry.lookup(nn);
//     invariant(
//       node !== undefined,
//       `[Loader]: Could not retrieve node "${ nn }" while building QueryProps
//        for relation query: "${ rel.name }" on "${ def.name }"`);
//
//     lookupObj[nn] = node[propNameStrategy];
//   }
//
//   return lookupObj;
// };

const buildRelationQueryColumns = (
  def: NodeDefinitionP,
  rel: NodeRelationP
): string[] => {
  const propNames: string[] = [];

  rel.loaderKeys.forEach((lk, idx) => {
    const opts: PostgresBackendOptions = lk.backendOpts;
    propNames.push(opts.column);
  });

  if (rel.filters) {
    rel.filters.forEach((filter, idx) => {
      const opts: PostgresBackendOptions = filter.backendOpts;
      propNames.push(opts.column);
    });
  }

  return propNames;
};

const buildRelationQueryKeys = (
  def: NodeDefinitionP,
  rel: NodeRelationP,
  rlks: NodeRelationLoaderKeyInput[]
): [string, string[]][] => {
  invariant(
    rlks && rlks.length > 0,
    `No loader keys specified for relation query key builder
     while building query keys for ${ def.name }`);
  invariant(
    rlks[0].keys.length === rel.loaderKeys.length,
    `[Loader]: Supplied "keys" parameter length ${ rlks[0].keys.length }
     does not match relation definition "loaderKeys" (${ rel.loaderKeys.length }).
     Relation "${ rel.name }" specifies ${ rel.loaderKeys.map(
       lk => `${ lk.node }.${ lk.prop }`).join(' ') }
     for this loader.`);

  const keysXfrmVertical = rel.loaderKeys.map(() => ['', []]);

  rlks.forEach((rlk) => {
    rlk.keys.forEach((k, idx) => {
      const ksvert = keysXfrmVertical[idx];
      // Check and set the column name for the key list.
      if (!ksvert[0]) {
        const opts: PostgresBackendOptions = rel.loaderKeys[idx].backendOpts;
        ksvert[0] = opts.column;
      }
      // We're grouping keys into logical columns, dataloader key input
      // is row-based, SQL batch query is column-based.
      ksvert[1].push(k);
    });
  });

  return keysXfrmVertical;
};

const groupAndSortRelationRows = (
  def: NodeDefinitionP,
  rel: NodeRelationP,
  rlks: NodeRelationLoaderKeyInput[],
  rows: {}[]
): Array<Array<string> | null> => {
  const grouped = {};
  const sorted = [];
  const rlkProps = rel.loaderKeys.map(lk => {
    const opts: PostgresBackendOptions = lk.backendOpts;
    return opts.column;
  });
  const rlkKeys = rlks.map(rlk => rlk.keys);

  rows.forEach((row, idx) => {
    const rlksValStr = rlkProps.reduce(
      (p, c) => p.concat(row[c]), []).join('-');

    if (!grouped[rlksValStr]) {
      grouped[rlksValStr] = [];
    }

    const opts: PostgresBackendOptions = rel.backendOpts;
    grouped[rlksValStr].push(row[opts.column]);
  });

  rlkKeys.forEach((rlkKey, idx) => {
    const rlkValStr = rlkKey.join('-');
    if (grouped[rlkValStr]) {
      sorted.push(grouped[rlkValStr]);
    } else {
      sorted.push(null);
    }
  });

  return sorted;
};


Object.assign(exports, {
  buildRelationQueryColumns,
  buildRelationQueryKeys,
  groupAndSortRelationRows
});
