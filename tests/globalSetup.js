const { MongoMemoryServer } = require("mongodb-memory-server");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const URI_FILE = path.join(os.tmpdir(), "jest-mongo-uri.txt");

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  // Write the URI to a temp file so setupFiles (which runs in each worker) can read it
  fs.writeFileSync(URI_FILE, uri);
  globalThis.__MONGOD__ = mongod;
};
