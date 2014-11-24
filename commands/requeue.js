#!/usr/bin/env node

var amqp = require('amqplib');

var args = process.argv.slice(2);
var tag = args[0];


function createChannel(conn) {
  console.log("connected");
  connection = conn;

  return conn.createChannel();

}

function redeliver(content) {

  console.log("redelivering!");
  //debugger;
  return connection.createChannel()
      .then(publish.bind(undefined, content));
     // .then(acknowledge.bind(undefined, ch, msg))

}

function publish(content, ch) {
  console.log("publishing to original queue");
//debugger;
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



  //  return ch.sendToQueue('hello', new Buffer(msg.content.toString()));

   // return ch.ack(msg).then(function(){ch.close();});
    

    //redeliver(msg);

    
    //return redeliver(ch, msg);


} else{

    console.log("looking some more, tag was " + msg.fields.deliveryTag);
    return seek(tag, ch);
  }

}

function seek(tag, ch) {
 
 console.log('checking queue dead');

//return ch.get('dead').then(ack.bind(undefined, ch));

 //return ch.ack(msg);

  return ch.get('dead', {noAck: false})
     .then(requeue.bind(undefined, ch, tag));
 
}

function ack(ch, msg) {
  console.log("acking");
  return ch.ack(msg.fields.deliveryTag);
}

function disconnect() {
  connection.close();
  console.log("connection closed");
}

var connection = null;
var messages = [];
amqp.connect('amqp://localhost')
     .then(createChannel)
     .then(seek.bind(undefined, tag))
     .then(function(){console.log('last operation1'); connection.close();});
