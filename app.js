var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var jsonRouter = require('./routes/json');

var WebSocketServer = require('websocket').server;
var http = require('http');

var hserver = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});

hserver.listen(8080, function() {
  console.log((new Date()) + ' WSServer is listening on port 8080');
});

wsServer = new WebSocketServer({
  httpServer: hserver,
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }
  var Map = require('./models/datasets');
  var connection = request.accept('superapp-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      var parsedMessage = JSON.parse(message.utf8Data);
      switch(parsedMessage.type) {
        case "getAll":
        console.log(parsedMessage);
        Map.find({}, function(err, markers) {
          var req = {
            type: 'getAll',
            date: Date.now(),
            data: markers
          };
          connection.sendUTF(JSON.stringify(req));
        });
        break;
        case "addOne":
        console.log(parsedMessage);
        console.log("Marker will be added soon!");
        var marker = new Map(parsedMessage.data);
        
        marker.save(function(err) {
          if (err) console.log(err);
          var req = {
            type: 'getOne',
            date: Date.now(),
            data: marker
          };
          connection.sendUTF(JSON.stringify(req));
        });
        break;
        case "moveOne":
        console.log('Got moveOne for id:');
        console.log(parsedMessage.data.id);
        Map.findOneAndUpdate({'_id': parsedMessage.data.id}, {'position': parsedMessage.data.position}, function(err, updated) {
          console.log(updated);
          var data = {
            mId: parsedMessage.data.id,
            status: "DONE"
          };
          var req = {
            type: 'moveOne',
            date: Date.now(),
            data: data
          };
          connection.sendUTF(JSON.stringify(req));
        });
        break;
        case "delOne":
        console.log("Marker "+parsedMessage.data+"will be deleted soon!");
        Map.findOneAndDelete({'_id': parsedMessage.data}, function(err, deleted) {
          console.log(deleted);
          var data = {
            mId: parsedMessage.data,
            status: "DONE"
          };
          var req = {
            type: 'delOne',
            date: Date.now(),
            data: data
          };
          connection.sendUTF(JSON.stringify(req));
        });
        break;
        default:
        console.log("Got undefined request:");
        console.log(parsedMessage.type);
      } 
      console.log('Received Message: ' + message.utf8Data);
    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});







var app = express();
app.locals.basedir = __dirname;

//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/superapp_map_db_1';

var mongo_option = { useNewUrlParser: true };
mongoose.connect(mongoDB, mongo_option);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/json*', jsonRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
