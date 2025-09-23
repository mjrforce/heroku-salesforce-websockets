var express = require('express');
const cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var config = require('./config.js');

var routes = require('./routes/index');
var app = express();
var server = require('http').Server(app);

//initialize io
var io = require('socket.io')(server, {
  cors: {
    origin: "https://orgfarm-63d3c365e1-dev-ed.develop.lightning.force.com",
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"]
  }
});

//On Connection Event
var socket = io.sockets.on('connection', function (socket) {
  console.log(JSON.stringify(socket));
 });

// setup view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(
  cors({
    origin: "https://orgfarm-63d3c365e1-dev-ed.develop.lightning.force.com",
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"]
  })
);

app.use(function(req, res, next){
  res.io = io;
  next();
});

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

// error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
 
// development error handler - print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler - no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = {app: app, server: server, config: config};
exports.config = config;
exports.socket = socket;
