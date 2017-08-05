/*       */

const invariant = require('invariant');

const {
  newPGPool,
  runTemplatedQuery
} = require('./engine');

const {
  buildRelationQueryColumns,
  buildRelationQueryKeys,
  groupAndSortRelationRows
} = require('./converters');

const {
  selectWhereInByUniqueColumn,
  selectWhereInManyWithFilterSort
} = require('./queries');

             
                  
                 
                
               
                                 

             
                            
                             

             
          
                  
                    
                     
                      

             
               
         
               
                  

import {
  PostgresBackendOptions
} from './types';

class Postgres                    {
               
                           
               

  constructor (name        , connection              ) {
    invariant(
      name,
      'A backend name is required when constructing a Postgres instance.');
    invariant(
      connection,
      `A connection configuration object is required when constructing
       a Postgres instance`);

    invariant(
      (connection.user &&
       connection.password &&
       connection.host &&
       connection.database),
      `Invalid Postgres connection object.
       Got: ${ JSON.stringify(connection) }`);

    this.name = name;
    this.connection = connection;
    this.pool = newPGPool(this.connection);
  }

  canonicalQuery(
    def                 ,
    canonical                ,
    keys          
  )                           {
    const backendOpts                         = canonical.backendOpts;

    const selectCols = def.properties.reduce((p, c) => {
      if (c.backendName == canonical.backendName) {
        const propOpts                         = c.backendOpts;
        p.push(propOpts.column);
      }
      return p;
    }, []);

    const query = selectWhereInByUniqueColumn(
      backendOpts.table,
      selectCols,
      backendOpts.column,
      keys
    );

    return runTemplatedQuery(this.pool, query).then((result) => {
      const rows = result.rows;
      const keyed = {};
      const sorted = [];

      for (const row of rows) {
        row._metadata = def;
        keyed[row[backendOpts.column]] = row;
      }

      for (const key of keys) {
        sorted.push(keyed[key] || null);
      }

      return sorted;
    });
  }

  vanityQuery(
    def                 ,
    prop               ,
    keys          
  )                             {
    return Promise.resolve([]);
  }

  relationQuery(
    def                 ,
    rel               ,
    rfks                              
  )                               {
    const opts                         = rel.backendOpts;

    const query = selectWhereInManyWithFilterSort(
      opts.table,
      buildRelationQueryColumns(def, rel),
      buildRelationQueryKeys(def, rel, rfks)
    );

    return runTemplatedQuery(this.pool, query).then((result) => {
      return groupAndSortRelationRows(
        def,
        rel,
        rfks,
        result.rows
      );
    });
  }

  preParseValidateOpts(opts) {
    return true;
  }

  postParseValidateOpts(opts) {
    return true;
  }

  parseCanonical(def, canonical) {
    return {};
  }

  parseProperty(def, canonicalP, prop) {
    return {};
  }

  parseRelation(def, canonicalP, rel) {
    return {};
  }

  parseRelationLoaderKey(def, canonicalP, rel, lk) {
    return {};
  }
}

Object.assign(exports, {
  default: Postgres
});
