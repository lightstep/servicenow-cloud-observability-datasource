// This comment is generated by Grafana toolkit:
// This file is needed because it is used by vscode and other tools that
// call `jest` directly.  However, unless you are doing anything special
// do not edit this file

const standard = require('@grafana/toolkit/src/config/jest.plugin.config');

/* 
  📝 NOTE:
  Buried deep in our dependency tree is `flatbuffers.js`, which is causing
  issues when we transpile for unit testing. We're overriding the Grafana
  toolkit's config to tell Jest to use its default behavior when it comes to
  transforming files within node_modules, which prevents our test runner from
  erroring out.

  This could be a bug within the Grafana toolkit.

   FYI, the default value for `transformIgnorePatterns` is `["/node_modules/", "\\.pnp\\.[^\\\/]+$"]`.
   More info in the Jest docs: https://jestjs.io/docs/configuration#transformignorepatterns-arraystring
 */
module.exports = {
  ...standard.jestConfig(),
  transformIgnorePatterns: undefined,
};
