/* @flow */

import type {
  Registry
} from '../lib/registry';

import type {
  Parser
} from './types';

const registry = require('../lib/registry');

const ParserRegistry: Registry<Parser> = registry.makeRegistry('parser');

exports.ParserRegistry = ParserRegistry;
