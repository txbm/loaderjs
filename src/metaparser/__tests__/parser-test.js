

const parser = require('../parser');

parser.defineParser({
  name: 'modelMeta',
  propTree: {
    name: 'string',
    canonical: {
      name: 'string'
    },
    properties: [
      {
        name: 'string',
        vanity: 'boolean'
      }
    ],
    relations: [
      {
        name: 'string',
        loaderKeys: [
          {
            node: 'string',
            prop: 'string'
          }
        ]
      }
    ]
  }
});

// parser.defineParser({
//   name: 'backendMeta',
//   propTree: {
//     canonical: {
//       backendName: 'string',
//       backendOpts: {}
//     },
//     properties: [
//       { backendOpts: {} }
//     ],
//     relations: [
//       { backendOpts: {} }
//     ],
//     loaderKeys: [
//       {
//         backendOpts: {}
//       }
//     ]
//   }
// });
