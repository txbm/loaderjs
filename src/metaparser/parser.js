/* @flow */

const CONSTRAINT_CHECKS = {
  MATCH:  0,
  DIFF:   1,
  ONE_OF: 2
};

const CONSTRAINT_SOURCE = {
  PATH:  1,
  VALUE: 2
};

type ParserConstraint = {
  path:   string;
  check:  $Keys<typeof CONSTRAINT_CHECKS>;
  source: $Keys<typeof CONSTRAINT_SOURCE>;
};

const defineParser = (
  name: string,
  propTree: { [string]: mixed },
  constraints: ParserConstraint[]
) => {};

const extendParser = (
  name: string,
  propTree: { [string]: mixed },
  constraints: ParserConstraint[]
) => {};

Object.assign(
  exports,
  {
    defineParser,
    extendParser
  }
);
