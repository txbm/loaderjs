const co = require('co');

let GrantList = new Set();

const GrantCache = new Map();

const listGrants = () => {
  return [...GrantList];
};

const hasGrantContext = (viewer, recordDef, grantContextName) => {
  if (!viewer.grants) return false;

  if (!GrantCache.has(viewer.id)) {
    GrantCache.set(viewer.id, new Map());
  }

  const cache = GrantCache.get(viewer.id);

  if (!cache.has(grantContextName)) {
    cache.set(
      grantContextName,
      !![...viewer.grants].find(g => {
        const parts = g.split(':');
        return parts[1] === recordDef.namespace && parts[2] == grantContextName;
      })
    );
  }

  return cache.get(grantContextName);
};

const hasGrantContextWildcard = (viewer, recordDef, grantContextName) => {
  if (!viewer.grants) return false;
  const wildcardGrantName = makeGrant(recordDef.namespace, grantContextName);
  return viewer.grants.has(wildcardGrantName);
};

const hasGrantContextField = (viewer, recordDef, grantContextName, fieldName) => {
  const fieldGrantName = makeGrant(recordDef.namespace, grantContextName, fieldName);
  return viewer.grants.has(fieldGrantName);
};

const buildGrants = recordDef => {
  const grants = [];

  grants.push(makeGrant(recordDef.namespace));

  for (const collection of recordDef.collections) {
    grants.push(makeGrant(recordDef.namespace, collection.grant));
    for (const field of Object.keys(recordDef.fields)) {
      grants.push(makeGrant(recordDef.namespace, collection.grant, field));
    }
  }

  recordDef.grants = grants;
  GrantList = new Set([...GrantList, ...grants]);
};

const authorize = co.wrap(function * (recordDef, viewer, row) {
  // @HACK disable auth
  return row;

  for (const grantContextName in recordDef.grantContexts) {
    if (hasGrantContext(viewer, recordDef, grantContextName)) {
      const grantContextFetcher = recordDef.grantContexts[grantContextName];
      const grantSet = yield grantContextFetcher(viewer);

      if (grantSet.has(row[recordDef.canonicalKey])) {

        if (hasGrantContextWildcard(viewer, recordDef, grantContextName)) {
          return row;
        }

        const filtered = {};

        for (const field of Object.keys(recordDef.fields)) {
          if (hasGrantContextField(viewer, recordDef, grantContextName, field)) {
            filtered[field] = row[field];
          }
        }
        return filtered;
      }
    }
  }

  return null;
});

const makeGrant = (resource, context = '*', field = '*') => {
  return `view:${ resource }:${ context }:${ field }`;
};

module.exports = {
  listGrants,
  hasGrantContext,
  hasGrantContextWildcard,
  hasGrantContextField,
  buildGrants,
  authorize,
  makeGrant,
  GrantCache
};
