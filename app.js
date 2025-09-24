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
    origin: process.env.ORIGIN,
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
    let trackerId = socket.handshake.auth.trackerId;
    socket.join(recordId);
    socket.join(userid);
    socket.join('all');

    let members = await getMembers(recordId);
    let membersarray = [...members];
    let payload = { id: recordId, username: username, userid: userid, count: membersarray.length, members: membersarray.join('\n') };
    console.log('payload: ' + JSON.stringify(payload));
    socket.to(recordId).emit('viewerconnected', payload)
    
    socket.on('disconnect', async function(){
      console.log('disconnected event...');
      let remainingmembers = await getMembers(recordId);
      let remainingmembersarray = [...remainingmembers];
      let randomuserid = await getRandomUser();
      payload = { id: recordId, username: username, userid: userid, count: remainingmembersarray.length, remainingmembers: membersarray.join('\n') };
      if(randomuserid)      
      socket.to(randomuserid).emit('viewerdisconnected', payload);
      else
      updateSalesforce({ Id: trackerId, Number_of_Viewers__c: 0, Viewers__c: '' });
    });
 });

 async function updateSalesforce(data){
  const ret = await conn.sobject("Case_Viewer_Tracker__c").update(data);
  if (ret.success) {
    console.log(`Updated Successfully : ${ret.id}`);
  }
 }

 async function getMembers(roomname){
    let sockets = await io.in(roomname).fetchSockets();
    let members = new Map();
    for(const s of sockets){
      if(s.handshake.auth.userid){
        console.log(JSON.stringify(s.handshake.auth));
        members.set(s.handshake.auth.userid, s.handshake.auth.name);
      }
    }
    return members.values();
 }

 async function getRandomUser(){
  let sockets = await io.in('all').fetchSockets();
  let arr = [...sockets];
  const randomIndex = Math.floor(Math.random() * arr.length);
  if(arr.length == 0)
  return null;
  else
  return arr[randomIndex].handnshake.auth.userid;
 }

module.exports = {app: app, server: server};
exports.socket = socket;
