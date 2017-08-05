const Log = require('log');

const default = new Log('info');

const ivmsg = (msg) => `[Loader]: ${ msg }`;

Object.assign(exports, {
  default,
  ivmsg
});
