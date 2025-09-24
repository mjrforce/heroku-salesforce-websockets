var express = require('express');
const cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var config = require('./config.js');

var routes = require('./routes/index');
var bodyparser = require('body-parser');
var app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(cors({origin: "https://orgfarm-63d3c365e1-dev-ed.develop.lightning.force.com"}));

var server = require('http').Server(app);

//initialize io
var io = require('socket.io')(server, {
  cors: {
    origin: "https://orgfarm-63d3c365e1-dev-ed.develop.lightning.force.com",
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"],
    credentials: true
  }
});

//On Connection Event
var socket = io.sockets.on('connection', async function (socket) {

    let recordId = socket.handshake.auth.recordId;
    let username = socket.handshake.auth.name;
    let userid = socket.handshake.auth.userid;
    socket.join(recordId);

    let members = await getMembers(recordId);
    let membersarray = [...members];
    let payload = { id: recordId, username: username, userid: userid, count: membersarray.length, members: membersarray.join('\n') };
    console.log('payload: ' + JSON.stringify(payload));
    socket.to(recordId).emit('viewerconnected', payload)
    

    socket.on('disconnect', async function(){
      console.log('disconnected event...');
      members = await getMembers(recordId);
      membersarray = [...members];
      payload = { id: recordId, username: username, userid: userid, count: membersarray.length, members: membersarray.join('\n') };
      socket.to(recordId).emit('viewerdisconnected', payload);
    });
 });

 async function getMembers(roomname){
    let sockets = await io.in(roomname).fetchSockets();
    let members = new Map();
    for(const s of sockets){
      if(s.handshake.auth.userid){
        console.log(JSON.stringify(s.handshake.auth));
        members.set(s.handshake.auth.userid, s.handshake.auth.name);
      }
    }
    console.log('members: ' + [...members.values()].join(','));
    console.log(members.values());
    console.log(JSON.stringify([...members.values()]));
    return members.values();
 }

// setup view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

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
