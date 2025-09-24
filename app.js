require('dotenv').config()
var jsforce = require('jsforce');
const { getToken } = require('salesforce-jwt-bearer-token-flow');
const privateKey = require('fs').readFileSync('./keys/server.key', 'utf8');

var express = require('express');
const cors = require('cors');
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

//initialize JSforce Connection
const conn = new jsforce.Connection();
let options = {
  iss: process.env.CLIENTID,
  sub: process.env.USERNAME,
  aud: process.env.URL,
  privateKey: privateKey
};

console.log('options:' + JSON.stringify(options));
getToken(options, function(err, response){
 console.log('Entered');
  if (err) {
    console.error(err);
  } else {
    conn.initialize({
      instanceUrl: response.instance_url,
      accessToken: response.access_token
    });
    console.log('Successfully connected to Org');
  }
});


//On Socket Connection Event
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

module.exports = {app: app, server: server};
exports.socket = socket;
