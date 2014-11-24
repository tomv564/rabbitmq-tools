#!/usr/bin/env node

var amqp = require('amqplib');
var when = require('when');

amqp.connect('amqp://fonq.dev').then(function(conn) {
  return when(conn.createChannel().then(function(ch) {
    var key = 'hello';
    
    var msg = 'Hello' + process.argv[2];
    //var msg = '{ "message" : "Hello World!", "details" : { "from" : "pants", "to" : "12345"}}';

    //var msg = 'Hello World!';
    var exchange = 'amq.topic';

    var ok = ch.assertQueue(key, {durable: true});
    
    return ok.then(function(_qok) {
      ch.publish(exchange, key, new Buffer(msg));
      console.log(" [x] Sent '%s'", msg);
      return ch.close();
    });
  })).ensure(function() { conn.close(); });;
}).then(null, console.warn);