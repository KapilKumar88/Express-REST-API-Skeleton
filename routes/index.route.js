const authRoute = require("./auth.route");
const taskRoute = require("./task.route");

module.exports = (app) => {
  app.use("/", authRoute);
  app.use("/task", taskRoute);
};
