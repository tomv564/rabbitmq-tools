var queues = (function () {

    var amqp = require('amqplib');
    var when = require('when');
    var amqpUri = process.env.AMQP_URI || 'amqp://localhost';

    var totalMessageCount = 0;
    var processedMessageCount = 0;

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
        return conn.createChannel();
    }

    function iterate(queue, callback, ch) {
        return when.iterate(function () {
                return ch.get(queue);
            },
            function (msg) {
                return msg === false;
            },
            callback,
            undefined
        );
    }

    function iterateRequeue(queue, callback, ch) {
        /*
        f - function that, given a seed, returns the next value or a promise for it.
        predicate - function that receives the current iteration value, and should return truthy when the iterating should stop
        handler - function that receives each value as it is produced by f. It may return a promise to delay the next iteration.
        seed - initial value provided to the handler, and first f invocation. May be a promise.
        */
        return when.iterate(function () {
                return ch.get(queue);
            },
            function (msg) {

                if (msg === undefined) {
                    // RabbitMQ counts from 1, this iteration from 0, first msg is always undefined.
                    processedMessageCount++;
                    return false;
                }
                else if (msg === false) {
                    return true;
                }

                if (processedMessageCount <= totalMessageCount) {
                    // Normal flow
                    console.log('Processing message ' + processedMessageCount + ' out of ' + totalMessageCount + '.');
                    processedMessageCount++;
                    return false;
                }
                else if(processedMessageCount > totalMessageCount)
                {
                    // You have reached the end of the current queue, doing a hard stop here.
                    // New messages might have been added to the iteration while iterating.
                    // We want to prevent that the same message get's offered over and over again.
                    console.log('Terminating, all messages where processed succesfully.');
                    console.log('During this iteration new messages ended up in the dead letter queue, they will be requeued in the next run.');
                    return true;
                }



                throw new Error("Something went wrong while requeuing messages, an unforseen situation occured.");
            },
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
            .then(function (ok) {
                ch.bindQueue(ok.queue, exchange, '#');
                return ch.consume(ok.queue, function (msg) {
                    callback(parse(msg));
                }, {noAck: true});
            });
    }

    function disconnect() {
        console.log("connection closed");
        return connection.close();

    }

    function redeliver(content, exchange, routingkey) {
        return connection.createChannel()
            .then(publish.bind(undefined, content, exchange, routingkey));
    }

    function publish(content, exchange, routingkey, ch) {
        ch.publish(exchange, routingkey, new Buffer(content), {'deliveryMode': 2});
        return ch.close();
    }


    function ackIfMatches(ch, deliveryTag, msg) {

        if (msg && msg.fields.deliveryTag == deliveryTag) {
            return ch.ack(msg);
        }

    }

    function redeliverAll(ch, msg) {

        if (msg) {

            var content = msg.content.toString();
            var queue = msg.properties.headers['x-death'][0]['queue'];

            ch.ack(msg);

            return redeliver(content, '', queue);

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
        setRequeueAllMessageCount: function (num_messages) {
            totalMessageCount = num_messages;
        },
        peek: function (queue) {
            console.log('peeking queue ' + queue + ' on ' + amqpUri);
            var messages = [];

            return amqp.connect(amqpUri)
                .then(createChannel)
                .then(iterate.bind(undefined, queue, function (msg) {
                    if (msg) messages.push(parse(msg));
                }))
                .then(disconnect)
                .then(function () {
                    console.log('done fetching messages');
                    return messages;

                });

        },
        requeueAll: function (queue) {
            return amqp.connect(amqpUri)
                .then(createChannel)
                .then(
                    function (ch) {
                        return iterateRequeue(queue, redeliverAll.bind(undefined, ch), ch);
                    })
                .delay(100)
                .then(disconnect)
                .then(function () {
                    console.log('done requeueing');
                    return true;
                });
        },
        requeue: function (queue, deliveryTag) {

            return amqp.connect(amqpUri)
                .then(createChannel)
                .then(
                    function (ch) {
                        return iterate(queue, redeliverIfMatches.bind(undefined, ch, deliveryTag), ch);
                    })
                .delay(100)
                .then(disconnect)
                .then(function () {
                    console.log('done requeueing');
                    return true;
                });

        },
        delete: function (queue, deliveryTag) {

            console.log("deleting delivery tag " + deliveryTag + " on " + queue);

            return amqp.connect(amqpUri)
                .then(createChannel)
                .then(
                    function (ch) {
                        return iterate(queue, ackIfMatches.bind(undefined, ch, deliveryTag), ch);
                    })
                .delay(100)
                .then(disconnect)
                .then(function () {
                    console.log('done deleting');
                    return true;
                });
        },
        startListening: function (exchange, callback) {
            return amqp.connect(amqpUri)
                .then(createChannel)
                .then(listen.bind(undefined, exchange, callback));
        }
    };
}());

module.exports = queues;
