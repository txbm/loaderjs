/*       */

const invariant = require('invariant');
const SQL = require('sql-template-strings');

const {
  selectStatement,
  whereInClause
} = require('./clauses');

             
                   
                   

const selectWhereInByUniqueColumn = (
  tablename        ,
  columns          ,
  whereCol        ,
  whereVals          
)                    => {
  invariant(tablename, 'tablename is required.');
  invariant(columns, 'columns are required.');
  invariant(whereCol, 'where column is required');
  invariant(whereVals, 'where values are required');

  const query = SQL``;
  query.append(selectStatement(columns, tablename));
  query.append(` WHERE`);
  query.append(whereInClause(whereCol, whereVals));
  return query;
};

const selectWhereInManyWithFilterSort = (
  tablename        ,
  columns          ,
  wherePairs                      ,
  filterTriplets                             ,
  sortPair                    
)                    => {
  invariant(tablename, 'tablename is required.');
  invariant(columns, 'columns are required.');
  invariant(wherePairs, 'where in pairs are required.');

  const query = SQL``;
  query.append(selectStatement(columns, tablename));
  query.append(` WHERE`);

  wherePairs.forEach(([ column, vals ], idx, arr) => {
    if (idx !== 0) {
      query.append(` AND`);
    }
    query.append(whereInClause(column, vals));
  });

  if (filterTriplets) {
    filterTriplets.forEach(([ column, predicate, val ], idx, arr) => {
      query.append(` AND ${ column } ${ predicate } `);
      if (val === null) { query.append('NULL'); }
      else { query.append(SQL`${ val }`); }
    })
  }

  if (sortPair) {
    const [ column, reverse ] = sortPair;
    query.append(` ORDER BY ${ column } ${ reverse ? 'ASC' : 'DESC' }`);
  }

  return query;
};


Object.assign(exports, {
  selectWhereInByUniqueColumn,
  selectWhereInManyWithFilterSort
});
