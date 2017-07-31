/* @flow */

const flatMap = (
  arr: mixed[],
  fn: () => mixed
): mixed[] => ([].concat(...arr.map(fn)));

Object.assign(exports, {
  flatMap
});
