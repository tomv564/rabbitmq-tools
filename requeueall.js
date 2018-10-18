var queues = require('./queues');

var messageCount = 0;
queues.peek('failed.dead').then(function(messages) {

	console.log(messages);
    queues.setRequeueAllMessageCount(messages.length);
	console.log('found ' + messages.length + ' messages');

	if (messages.length < 1)
		return;

	queues.requeueAll('failed.dead');

});

