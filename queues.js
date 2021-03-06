var queues = (function () {

var amqp = require('amqplib');
var when = require('when');

var amqpUri = process.env.AMQP_URI || 'amqp://localhost';

function createChannel(conn) {
  console.log("connected");
  connection = conn;
  conn.on('error', function (err) {
  	console.log(err);
  });
  return conn.createChannel();

}

function iterate(queue, callback, ch) {

  return when.iterate(function() { return ch.get(queue); }, 
    function(msg) { return msg === false; },
    callback,
    undefined
    );

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


function listen(exchange, callback, ch) {

  return ch.assertQueue(null, {autodelete: true})
             .then(function(ok) { 
                ch.bindQueue(ok.queue, exchange, '#'); 
                return ch.consume(ok.queue, function(msg) { callback(parse(msg));}, {noAck: true});
              });
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


function ackIfMatches(ch, deliveryTag, msg) {

  if (msg && msg.fields.deliveryTag == deliveryTag) {
    return ch.ack(msg);
  }

}

function redeliverIfMatches(ch, deliveryTag, msg) {

  if (msg && msg.fields.deliveryTag == deliveryTag) {

    var content = msg.content.toString();
    var queue = msg.properties.headers['x-death'][0]['queue'];

    ch.ack(msg);

    return redeliver(content, '', queue);

  }

}

	return {

		peek: function(queue) {
      console.log('peeking queue ' + queue + ' on ' + amqpUri);
      var messages = [];

      return amqp.connect(amqpUri)
				.then(createChannel)
				.then(iterate.bind(undefined, queue, function(msg) { if (msg) messages.push(parse(msg)); } ))
				.then(disconnect)
				.then(function() {
					console.log('done fetching messages');
					return messages;

				});

		},
		requeue: function(queue, deliveryTag) {

			return amqp.connect(amqpUri)
				.then(createChannel)
				.then(
          function(ch) {
             return iterate(queue, redeliverIfMatches.bind(undefined, ch, deliveryTag), ch);
          })
        .delay(100)
				.then(disconnect)
				.then(function() {
					console.log('done requeueing');
					return true;
				});

		},
    delete: function(queue, deliveryTag) {
        
      console.log("deleting delivery tag " + deliveryTag + " on " + queue);

      return amqp.connect(amqpUri)
        .then(createChannel)
        .then(
          function(ch) {
             return iterate(queue, ackIfMatches.bind(undefined, ch, deliveryTag), ch);
          })
        .delay(100)
        .then(disconnect)
        .then(function() {
          console.log('done deleting');
          return true;
        });
    },
    startListening: function(exchange, callback) {
      return amqp.connect(amqpUri)
          .then(createChannel)
          .then(listen.bind(undefined, exchange, callback));
    }
	};
}());

module.exports =  queues;