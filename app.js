const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const winston = require('./config/winston');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const mongoose = require('mongoose');
const db = require('./config/db')
const { sendResponse } = require('./helpers/requestHandler.helper');

const indexRouter = require('./routes/index.route');

const app = express();

// mongo db connection
mongoose.connect(`${db.DB_CONNECTION}`);
const dbConn = mongoose.connection;
dbConn.on("error", console.error.bind(console, "connection error: "));
dbConn.once("open", function () {
  console.log(process.env.NODE_ENV);
  console.log("Connected successfully");
});
//end of connection

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('combined', { stream: winston.stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(YAML.load('./documentation/swagger.yaml')));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};
  winston.error(`${err.status || 500} | ${err.message} | ${req.originalUrl} | ${req.method} | ${req.ip}`);
  return sendResponse(res, false, err.status || 500, 'Internal server error.');
});

module.exports = app;
