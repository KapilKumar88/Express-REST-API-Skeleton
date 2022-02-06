const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/winston.util');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { sendResponse } = require('./helpers/requestHandler.helper');
require('./utils/db-connection.util');
//Route files
const indexRouter = require('./routes/index.route');

const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('combined', { stream: logger.stream }));
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
  logger.error(`${err.status || 500} | ${err.message} | ${req.originalUrl} | ${req.method} | ${req.ip}`);
  return sendResponse(res, false, err.status || 500, 'Internal server error.');
});

module.exports = app;
