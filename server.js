var express = require('express');
var queues = require('./queues');
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

app.get('/queues/:queue/items', function(req, res) {

  queues.peek(req.params.queue)
        .then(res.json.bind(res))
        .catch(function(err){ res.status(404).end(); });

});

app.get('*', function(request, response){
  response.sendFile(__dirname + '/public/index.html');
});

var server = app.listen(port, function() {
	console.log("Listening on port %d", port);
});