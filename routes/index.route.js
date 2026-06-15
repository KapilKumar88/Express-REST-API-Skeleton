const authRoute = require("./auth.route");
const taskRoute = require("./task.route");

module.exports = function registerRoutes(app) {
  app.use("/api", authRoute);
  app.use("/api/task", taskRoute);
};
