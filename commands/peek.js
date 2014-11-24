#!/usr/bin/env node

var amqp = require('amqplib');


function createChannel(conn) {
  console.log("connected");
  connection = conn;

  return conn.createChannel();

}

function collect(ch, msg) {
  if (msg) {
    messages.push(msg.content.toString());
    return peek(ch);
  }

}

function peek(ch) {
 
  return ch.get('hello')
    .then(collect.bind(undefined, ch));
 
}

function display() {
  console.log("Messages: %j", messages);
}

function disconnect() {
  connection.close();
  console.log("connection closed");
}

var connection = null;
var messages = [];
amqp.connect('amqp://fonq.dev')
     .then(createChannel)
     .then(peek)
     .then(display)
     .finally(disconnect);
