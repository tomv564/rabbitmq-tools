var express = require('express');
var app = express();
var messages= [];
var amqp = require('amqplib');
var when = require('when');

app.use(express.static __dirname+'/public')

