var express = require('express');
var app = express();
var messages= [];
var amqp = require('amqplib');
var when = require('when');
//var messages = [];
// setup channel.
// var ch = null;
// var conn = null;
// var ok = amqp.connect('amqp://localhost')
// var ok = ok.then(function(connection) { conn = connection; connection.createChannel()});
// ok.then(function(channel) { ch = channel; console.log("Channel ready");});

// handle shutdown
// process.once('SIGINT', function() { 

// 	// console.log("Disconnecting from RabbitMQ");
// 	// conn.close();
// 	// console.log("amqp connection closed");

// });

function createChannel(conn) {
  console.log("connected");
  connection = conn;

  return conn.createChannel();

}

function collect(ch, queue, msg) {
  
  if (msg) {
    messages.push(parse(msg));
    return peek(queue, ch);
  } 
}

function parse(msg) {
	return {
		id: msg.fields.deliveryTag,
		routingKey: msg.fields.routingKey,
		properties: msg.properties,
		content: msg.content.toString()
	};
}

function peek(queue, ch) {
  
  console.log("getting messages");
  
  return ch.get(queue)
           .then(collect.bind(undefined, ch, queue));
 
}

function display() {
  console.log("Messages: %j", messages);
}

function disconnect() {
  console.log("connection closed");
  return connection.close();
  
}


function redeliver(content) {

  console.log("redelivering!");
  return connection.createChannel()
      .then(publish.bind(undefined, content));
}

function publish(content, ch) {
  console.log("publishing to original queue");
  ch.publish('', 'hello', new Buffer(content));
   return ch.close();
}

function requeue(ch, tag, msg) {
  if (!msg) {
    console.log(" no message returned!");
    return;
  }

  if (msg.fields.deliveryTag == tag) {
    
    console.log("found the message!");

    var content = msg.content.toString();

    ch.ack(msg);
    console.log("acked, now resending");

    return redeliver(content)
              .then(seek.bind(undefined, tag, ch));

} else{

    console.log("looking some more, tag was " + msg.fields.deliveryTag);
    return seek(tag, ch);
  }

}

function seek(tag, ch) {
 
 console.log('checking queue dead');

  return ch.get('dead', {noAck: false})
     .then(requeue.bind(undefined, ch, tag));
 
}

var queues = [
	{ name: 'hello'}
];

function getQueues(name) {
	return queues.filter(function(queue) { 
		return (queue.name == name);
	});
}

var bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.all("/*", function(req, res, next){
 var headers = {};
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
  

    next();
});

app.get('/queues', function(req, res) {

	var names = queues.map(function(queue) { return queue.name; });

	res.json({queues: names});
});

app.post('/requeue', function(req, res) {

	console.log('got a requeue request');
	console.log(req.body.deliveryTag);


	var connection = null;
	var messages = [];
	amqp.connect('amqp://localhost')
	     .then(createChannel)
	     .then(seek.bind(undefined, req.body.deliveryTag))
	     .then(disconnect);


	res.status(204).end();
});

app.get('/queues/:queue/items', function(req, res) {

	var connection = null;
	messages = [];
	amqp.connect('amqp://localhost')
		.then(createChannel)
		.then(peek.bind(undefined, req.params.queue))
		.then(disconnect)
		.then(function() {
			console.log('done fetching messages');
			res.json(messages);

		});

});


var server = app.listen(3000, function() {
	console.log("Listening on port %d", 3000);
});