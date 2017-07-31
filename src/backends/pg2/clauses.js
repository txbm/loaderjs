/* @flow */

const SQL = require('sql-template-strings');

export type SQLTemplateString = typeof SQL;

const selectStatement = (
  fields: string[],
  table: string
): SQLTemplateString => (
  SQL`SELECT `
    .append(fields.join(', '))
    .append(` FROM `).append(table)
);

const subSelectStatement = (
  fields: string[],
  table: string,
  partitionKey: string,
  sort: { key: string; reverse: boolean } | null = null
): SQLTemplateString => {
  if (fields.indexOf(partitionKey) < 0) fields.push(partitionKey);

  const q = SQL`SELECT `
    .append(fields.join(', '))
    .append(` FROM (SELECT ROW_NUMBER() OVER (PARTITION BY ${ partitionKey }`);

  if (sort) {
    q.append(` ORDER BY ${ sort.key } ${ sort.reverse ? 'ASC' : 'DESC' }`);
  }

  q.append(`) AS rn, ${ fields.join(', ') } FROM ${ table }) sq`);

  return q;
};

const whereInClause = (
  key: string,
  values: any[]
): SQLTemplateString => {
  const q = SQL``.append(` ${ key } IN (`);
  let idx = 0;
  for (const v of values) {
    if (idx === values.length - 1) {
      q.append(SQL`${ v }`);
    } else {
      q.append(SQL`${ v },`);
    }
    idx += 1;
  }
  q.append(`)`);
  return q;
};

Object.assign(exports, {
  selectStatement,
  subSelectStatement,
  whereInClause
});

// const parseResultIntoRows = (result = null, takeOne = false) => {
//
//   if (result) {
//     const { command, rowCount, rows } = result;
//     if (command === 'SELECT') {
//       if (rowCount === 0) return [];
//       if (takeOne) return rows[0];
//       return rows;
//     }
//   }
//
//   return result;
// };
//
// const runQueriesInTransaction = co.wrap(function * (queries) {
//   const client = yield pgPool.connect();
//   let results = null;
//   const queryId = shortid.generate();
//
//   try {
//     debug(`[PG Query RUNNING] -> ${ queryId } : ${ queries.map(q => q.strings).join(', \n ') }`);
//     yield client.query('BEGIN');
//     results = yield Promise.all(queries.map(q => client.query(q)));
//     yield client.query('COMMIT');
//     client.release();
//     debug(`[PG Query DONE] -> ${ queryId }`);
//   } catch (error) {
//     client.release(true);
//     log.error(`[PG Query ERROR] -> ${ queryId } : ${ error }`);
//     error.queryId = queryId;
//     throw error;
//   }
//
//   return results;
// });
//

//
// const queryLoader = new DataLoader(
//   queries => Promise.all(
//     queries.map(q => runQuery(q)))
//     .catch(e => { throw e; }),
//   { cache: false });
