var queues = require('./queues');

queues.peek('failed.dead').then(function(messages) {

	console.log('found ' + messages.length + ' messages');

	if (messages.length < 1)
		return;

	queues.requeueAll('failed.dead');

});

