/*       */

const flatMap = (
  arr         ,
  fn             
)          => ([].concat(...arr.map(fn)));

Object.assign(exports, {
  flatMap
});
