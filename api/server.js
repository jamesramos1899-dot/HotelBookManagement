const path = require('path');

function tryRequire(name, fallbackPath) {
  try {
    return require(name);
  } catch (e) {
    try {
      return require(fallbackPath);
    } catch (e2) {
      throw e; // original error
    }
  }
}

const serverless = tryRequire('serverless-http', path.resolve(__dirname, '../backend/node_modules/serverless-http'));
const app = require('../backend/server');

module.exports = serverless(app);
