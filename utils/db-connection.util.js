const dbConfig = require("../config/db.config");
const mongoose = require("mongoose");
const logger = require("./winston.util");

// mongo db connection
mongoose.connect(`${dbConfig.DB_CONNECTION}`);
const dbConn = mongoose.connection;
dbConn.on("error", () => {
  logger.error("Mongodb connection error");
});
dbConn.once("open", function () {
  logger.info(`Mongodb connected successfully | Env: ${process.env.NODE_ENV}`);
});
// end of connection
