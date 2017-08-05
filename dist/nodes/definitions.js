/*       */

const invariant = require('invariant');
const { ivmsg } = require('../logging');
const { BackendRegistry } = require('../backends/registry');

/**
 && The Node Definitions &&

 The purpose of the definition object is to specify a logical node in an
 application graph without being overly reliant on the specific datastore
 implementations of the various properties or related nodes.

 That said, attempting to over-abstract or obscure the actual details of the
 datastore would be leaky and probably overly confusing instead of helpful.

 Therefore, the approach taken here is basically a cascading set of options
 for specifying where and how to find the actual data to back a particular set
 of node properties or relationships.

 You might be thinking: sounds like an ORM... and you would be sort of right
 except that another way of looking at it is that GraphQL itself is in a way
 an ORM, and this is just an abstraction for mapping the logical node
 data efficiently to the resolver functions that form the true object-graph.

 Example Node Definitions:

 {
  name: 'User',
  canonical: {
    name: 'id',
    backendName: 'main_pg_store',
    backendOpts: {
      table: 'users',
      column?: 'id'
    }
  },
  properties: [
    { name: 'username', vanity: true, backendOpts? : {...} },
    { name: 'email_address', vanity: true, backendOpts? : {...} },
    { name: 'biography' }
    // If you don't override backendName or backendOpts for properties
    // they just inherit from the canonical property.
  ],
  relations: [
    {
      name: 'friends',
      // This tells us where to look for the canonical id for the Nodes we
      // are relating to.
      backendOpts: {
        table: 'users_friends',
        column: 'user_to_id'
      },
      loaderKeys: [
        {
          node: 'User',
          prop: 'id',
          backendOpts: {
            column: 'user_from_id'
          }
        }
      ]
    }
  ]
 }

**/

             
                
                               

/* Input Definitions */

                              
               
                           
                             
                             
  

                             
               
                      
                              
  

                            
               
                   
                       
                               
           

                            
               
                       
                               
                                      
                                 
  

                                     
               
               
                               
  

                                  
               
               
                    
                
                               
  

/* Parsed and Validated */

                               
               
                            
                              
                              
  

                              
               
                      
                              
  

                             
               
                  
                      
                              
  

                             
               
                      
                              
                                       
                                 
  

                                      
               
               
                              
  

                                   
               
               
                    
                
                              
  

// export type NodeDefinitionP = {
//   name: string;
//   ca
//   namespace: string;
//   properties: NodeProperties;
//   relations?: ParsedNodeRelation[];
//
//   // Precomputed transformations
//   canonicalPropName: string;
//   propNames: string[];
//   propNamesPrefixed: string[];
//   propNamesLookup: { [prop: string]: string };
//   propNamesLookupNSPrefixed: { [prop: string]: string };
//   propNamesLookupNodePrefixed: { [prop: string]: string };
// };

// export type ParsedNodeRelation = {
//   name: string;
//   namespace: string;
//   datastoreName: string;
//   fetchKeys: NodeRelationLoaderKeyDefinition[];
//   filters?: NodeRelationFilterDefinition[];
// };

                                   
                                                  
                                        
                                             
                    
 ;

const NodeDefinitionRegistry                          = {
  _registry: new Map(),
  lookup (name        )                         {
    if (!this._registry.has(name)) {
      throw new Error(
        `[Loader]: -> Node definition registry does not have ${ name }.
         You must register it before it can be automatically resolved.`);
    }

    return this._registry.get(name);
  },
  register (def                 )       {
    this._registry.set(def.name, def);
  },
  getAll ()                                {
    return [...this._registry.entries()].reduce((p, [name, def]) => {
      p[name] = def;
      return p;
    }, {});
  },
  wipe ()       {
    this._registry.clear();
  }
};

const _prefixPropName = (ns, propName) => `${ ns }_${ propName }`;

const _validOrThrowBackendOpts = (
  def                ,
  defpart   
                 
                        
                               
   ,
  pre          = true
) => {
  let validOrReason;
  const backend = BackendRegistry.lookup(defpart.backendName);

  if (pre) {
    validOrReason = backend.preParseValidateOpts(defpart.backendOpts);
  } else {
    validOrReason = backend.postParseValidateOpts(defpart.backendOpts);
  }

  if (validOrReason !== true) {
    throw new Error(
      ivmsg(`Node definition part "${ defpart.name }" on "${ def.name }" failed to
             validate backend options ${ pre ? 'BEFORE' : 'AFTER' } parsing:
             ${ validOrReason }
             Got: ${ JSON.stringify(defpart.backendOpts) }`));
  }
};

const _pvCanonical = (
  def                ,
  canonical               
)                 => {
  invariant(
    canonical.name,
    ivmsg(`Node canonical definition for ${ def.name }
           is missing required "name". Got ${ JSON.stringify(canonical) }`));
  invariant(
    canonical.backendName,
    ivmsg(`Node canonical definition for ${ def.name }
           is missing required "backendName". Got ${ JSON.stringify(canonical) }`));
  invariant(
    canonical.backendOpts,
    ivmsg(`Node canonical definition for ${ def.name }
           is missing required backendOpts. Got ${ JSON.stringify(canonical) }`));

  _validOrThrowBackendOpts(def, canonical);

  const parsed = Object.assign({}, canonical);

  _validOrThrowBackendOpts(def, parsed, false);

  return parsed;
};

const _pvProperties = (
  def                ,
  canonicalp                ,
  props                
)                  => {
  return props.map((prop) => {
    let name;
    let vanity;
    let backendName;
    let backendOpts;

    let backend;

    invariant(
      typeof prop === 'string' || prop.hasOwnProperty('name'),
      ivmsg(`Property definition for ${ def.name } missing required "name"
             property and is not using simple string syntax.`));

    if (typeof prop === 'string') {
      name = prop;
      vanity = false;
      backendName = canonicalp.backendName;
      backend = BackendRegistry.lookup(backendName);
      backendOpts = backend.parseProperty(def, canonicalp, prop);
    } else {
      name = prop.name;
      vanity = prop.vanity === undefined ? false : prop.vanity;
      backendName = (prop.backendName === undefined ?
                     canonicalp.backendName :
                     prop.backendName);
      backend = BackendRegistry.lookup(backendName);

      if (prop.backendOpts) {

        _validOrThrowBackendOpts(
          def,
          {
            name,
            backendName,
            backendOpts: prop.backendOpts
          }
        );
        backendOpts = backend.parseProperty(def, canonicalp, prop);
      }
    }

    if (backendOpts) {
      _validOrThrowBackendOpts(
        def,
        {
          name,
          backendName,
          backendOpts
        },
        false
      );
    }

    return Object.assign({}, {
      name,
      vanity,
      backendName,
      backendOpts
    });
  });
};

const parseAndValidateNodeDefinition = (
  def                
)                  => {
  const parsed = {};

  invariant(
    def.name,
    ivmsg(`Node definition is missing required name.
           Got ${ JSON.stringify(def) }`));

  invariant(
    def.canonical,
    ivmsg(`Node definition is missing required canonical definition.
           Got ${ JSON.stringify(def) }`));

  invariant(
    def.properties,
    ivmsg(`Node definition is missing required properties definition.
           Got ${ JSON.stringify(def) }`));

  parsed.name = def.name;
  parsed.canonical = _pvCanonical(def, def.canonical);
  parsed.properties = _pvProperties(def, parsed.canonical, def.properties);
  return parsed;

  // invariant(
  //   def.properties && Object.keys(def.properties).length > 0,
  //   `[Loader]: Node definition requires at least one (canonical) property
  //    (and preferrably some other fields too :).
  //    Got ${ JSON.stringify(def) }`);
  //
  // parsed.name = def.name;
  // parsed.datastoreName = def.datastoreName;
  // parsed.namespace = def.namespace;
  // parsed.properties = def.properties;
  // parsed.propNames = Object.keys(def.properties);
  //
  // parsed.propNamesPrefixed = Object.keys(def.properties).map(
  //   (propName) => _prefixPropName(def.namespace, propName));
  //
  // parsed.propNamesLookup = parsed.propNames.reduce((p, c) => {
  //   p[c] = c;
  //   return p;
  // }, {});
  //
  // parsed.propNamesLookupNSPrefixed = parsed.propNames.reduce((p, c) => {
  //   p[c] = _prefixPropName(def.namespace, c);
  //   return p;
  // }, {});
  //
  // parsed.propNamesLookupNodePrefixed = parsed.propNames.reduce((p, c) => {
  //   p[c] = _prefixPropName(def.name.toLowerCase(), c);
  //   return p;
  // }, {});
  //
  // for (const propName in def.properties) {
  //   const prop = def.properties[propName];
  //   if (prop.canonical) {
  //     if (!parsed.canonicalPropName) {
  //       parsed.canonicalPropName = propName;
  //     } else {
  //       throw new Error(
  //         `[Loader]: Node definition for ${ def.name } tried to
  //         specify ${ propName } as the canonical property but
  //         ${ parsed.canonicalPropName } was already specified.
  //         Cannot have more than one canonical property.
  //         Are you looking for the { vanity: true } option?`);
  //     }
  //   }
  // }
  //
  // invariant(
  //   parsed.canonicalPropName,
  //   `[Loader]: No canonical property was found for ${ def.name }.
  //    You cannot define a Node without a canonical property.`);
  //
  // // bind to prevent possibly undefined value of def.relations
  // const relations = def.relations;
  // if (relations) {
  //   parsed.relations = [];
  //
  //   for (const rel of relations) {
  //     const parsedRel = Object.assign({}, rel);
  //     invariant(
  //       rel.name,
  //       `Missing required name field for relation defined on ${ def.name },
  //        in position ${ relations.indexOf(rel) }.`);
  //
  //     invariant(
  //       rel.fetchKeys && rel.fetchKeys.length > 0,
  //       `At least one fetch key is required for relation "${ rel.name }"
  //       defined on ${ def.name }`);
  //
  //     for (const fk of rel.fetchKeys) {
  //       invariant(
  //         fk.nodeName,
  //         `Must specify a nodeName for fetch key defined on "${ rel.name }"
  //          in position ${ rel.fetchKeys.indexOf(fk) }`);
  //
  //       invariant(
  //         fk.propName,
  //         `Must specify a propName for fetch key defined on "${ rel.name }"
  //          in position ${ rel.fetchKeys.indexOf(fk) }`);
  //     }
  //
  //     parsedRel.fetchkeys = rel.fetchKeys;
  //
  //     if (!rel.namespace) {
  //       parsedRel.namespace = def.namespace;
  //     }
  //
  //     if (!rel.datastoreName) {
  //       parsedRel.datastoreName = def.datastoreName;
  //     }
  //
  //     parsed.relations.push(parsedRel);
  //   }
  // }
  //
  // return parsed;
};

// const _checkRelations = () => {
//   const defs = NodeDefinitionRegistry.getAll();
//   const defNames = Object.keys(defs);
//
//   for (const defName in defs) {
//     const def = defs[defName];
//     if (def.relations) {
//       const rels = def.relations;
//       for (const rel of rels) {
//         for (const fk of rel.fetchKeys) {
//           invariant(
//             defNames.find((df) => df === fk.nodeName),
//             `Could not find "${ fk.nodeName }" in registry for relation
//             "${ rel.name }" on node definition for "${ def.name }"`);
//           }
//         }
//     }
//   }
// };

const integrityCheck = () => {
  // _checkRelations();
  return true;
};

Object.assign(exports, {
  NodeDefinitionRegistry,
  parseAndValidateNodeDefinition,
  integrityCheck
});
