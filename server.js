var express = require('express');
var queues = require('./queues');
var WebSocketServer = require("ws").Server;
var http = require('http');
var app = express();
var port = process.env.PORT || 3000;

// parse json posts
var bodyParser = require('body-parser');
app.use( bodyParser.json() );

app.use(express.static(__dirname + '/public'));

app.post('/requeue', function(req, res) {

	queues.requeue(req.body.from, req.body.deliveryTag)
        .then(function(whatever) {

          res.status(204).end();

        });
	
});

app.post('/delete', function(req, res) {

  queues.delete(req.body.from, req.body.deliveryTag)
        .then(function(whatever) {

          res.status(204).end();

        });
  
});

app.get('/queues/:queue/items', function(req, res) {

  queues.peek(req.params.queue)
        .then(res.json.bind(res))
        .catch(function(err){ res.status(404).end(); });

});

app.get('*', function(request, response){
  response.sendFile(__dirname + '/public/index.html');
});


var server = http.createServer(app);
server.listen(port, function() {
  console.log("Listening on port %d", port);
});

var wss = new WebSocketServer({server: server});
console.log("websocket server created");

wss.on("connection", function(ws) {

  console.log('url was: ' + ws.upgradeReq.url);

  path = ws.upgradeReq.url;

  exchange = '';
  if (path && (path.substring(0,1) == '/'))
    exchange = path.substring(1);

  console.log(exchange);

  queues.listen(exchange, function(msg) { ws.send(JSON.stringify(msg)); });

  // var id = setInterval(function() {
  //   ws.send(JSON.stringify(new Date()), function() {  });
  // }, 1000);

  console.log("websocket connection open");

  ws.on("close", function() {
    console.log("websocket connection close");
    //clearInterval(id);
  });
});