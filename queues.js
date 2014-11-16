var queues = (function () {

var messages = [];
var amqp = require('amqplib');
var when = require('when');

var amqpUri = process.env.AMQP_URI || 'amqp://localhost';

// handle shutdown
// process.once('SIGINT', function() { 

// 	// console.log("Disconnecting from RabbitMQ");
// 	// conn.close();
// 	// console.log("amqp connection closed");

// });

function createChannel(conn) {
  console.log("connected");
  connection = conn;
  conn.on('error', function (err) {
  	console.log(err);
  });
  messages = [];
  return conn.createChannel();

}

function collect(ch, queue, msg) {
  
  if (msg) {
    messages.push(parse(msg));
    return peekChannel(queue, ch);
  } 
}

function parse(msg) {
	return {
		id: msg.fields.deliveryTag,
		routingKey: msg.fields.routingKey,
		properties: msg.properties,
		content: msg.content.toString(),
    timestamp: msg.timestamp
	};
}

function peekChannel(queue, ch) {
  
  console.log("getting messages");
  
  return ch.get(queue)
           .then(collect.bind(undefined, ch, queue));
 
}

function listenChannel(exchange, callback, ch) {

  return when.all([
      ch.assertQueue('_listener', {autodelete: true}),
      //ch.assertExchange(exchange, 'topic'),
      ch.bindQueue('_listener', exchange, '#'),
      ch.consume('_listener', function(msg) { callback(parse(msg));}, {noAck: true})
    ]);
  
}

function display() {
  console.log("Messages: %j", messages);
}

function disconnect() {
  console.log("connection closed");
  return connection.close();
  
}

function redeliver(content, exchange, routingkey) {

  console.log("redelivering!");
  return connection.createChannel()
      .then(publish.bind(undefined, content, exchange, routingkey));
}

function publish(content, exchange, routingkey, ch) {
  console.log("publishing to original queue");
  ch.publish(exchange, routingkey, new Buffer(content));
   return ch.close();
}

function checkmsg(tag, queue, ch, operation, msg) {
  if (!msg) {
    console.log(" no message returned!");
    return;
  }

  if (msg.fields.deliveryTag == tag) {
    
    console.log("found the message!");

    return handleMessage(ch, queue, msg, operation);

  } else {

    console.log("looking some more, tag was " + msg.fields.deliveryTag);
    return seek(tag, queue, operation, ch);
  }

}

function handleMessage(ch, queue, msg, operation) {

    var content = msg.content.toString();
    var exchange = msg.properties.headers['x-death'][0].exchange;
    var routingkey = msg.properties.headers['x-death'][0]['routing-keys'][0];

    ch.ack(msg);

    console.log("acked");
  
    if (operation == 'requeue')
      return redeliver(content, exchange, routingkey);
              //.then(seek.bind(undefined, tag, queue, ch));

    return ch.get(queue);
}

function seek(tag, queue, operation, ch) {


 console.log('checking queue ' + queue + ' for tag ' + tag);


if (!ch)
	console.log("ch is undefined!");
 
  return ch.get(queue, {noAck: false})
     .then(checkmsg.bind(undefined, tag, queue, ch, operation));
 
}

	return {
		peek: function(queue) {
      console.log('peeking queue ' + queue + ' on ' + amqpUri);

      return amqp.connect(amqpUri)
				.then(createChannel)
				.then(peekChannel.bind(undefined, queue))
				.then(disconnect)
				.then(function() {
					console.log('done fetching messages');
					return messages;

				});

		},
		requeue: function(queue, deliveryTag) {

			return amqp.connect(amqpUri)
				.then(createChannel)
				.then(seek.bind(undefined, deliveryTag, queue, 'requeue'))
				.then(disconnect)
				.then(function() {
					console.log('done requeueing');
					return true;
				});

		},
    delete: function(queue, deliveryTag) {
      return amqp.connect(amqpUri)
        .then(createChannel)
        .then(seek.bind(undefined, deliveryTag, queue, 'delete'))
        .then(disconnect)
        .then(function() {
          console.log('done deleting');
          return true;
        });
    },
    listen: function(exchange, callback) {
      return amqp.connect(amqpUri)
          .then(createChannel)
          .then(listenChannel.bind(undefined, exchange, callback));
    }
	};
}());

module.exports =  queues;