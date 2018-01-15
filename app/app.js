var Dispatcher = require("./dispatcher");
var QueueItemList = React.createFactory(require('./queueitems'));
var currentQueue;
var currentExchange;


function setQueue(queue) {

  currentQueue = queue;

  router.navigate('manage/' + queue);
  document.title = "Manage Queue: " + queue;
  
  reload();

}

function setListen(exchange) {

	currentExchange = exchange;

	router.navigate('listen/' + exchange);
	document.title = "Listening: " + exchange;

	listen();

}

function reload() {
	$.getJSON('/queues/' + currentQueue + '/items', null)
		.done(showItems)
		.fail(showItems.bind(undefined, null));
}

function listen() {
	
	var host = location.origin.replace(/^http/, 'ws');
	
	var data = [];
	showItems([]);
    
    wsUrl = host + '/' + currentExchange;

	var ws = new WebSocket(wsUrl);
	ws.onmessage = function (event) {

		data.push(JSON.parse(event.data));

		showItems(data);      
	};
}

var Router = Backbone.Router.extend({

  routes: {
    "manage/:queue":        "manage",  
    "listen/:exchange":      "listen"
  }

});

var router = new Router();

router.on('route:manage', function(queue) {
		$('input[name=queue]').val(queue);
        setQueue(queue); 
});

router.on('route:listen', function(exchange){
		$('input[name=exchange]').val(exchange);
		setListen(exchange);
});

Backbone.history.start({pushState: true});

function showItems(data) {
	React.render(
	  QueueItemList({messages: data}),
	  document.getElementById('component')
	);
}

function itemsChanged() {
	console.log("item operation done");
	reload();
}

$('form#manage').on('submit', function(event) {

	event.preventDefault();
	var queue = $('input[name=queue]').val();
	setQueue(queue);

});

$('form#listen').on('submit', function(event) {

	event.preventDefault();
	var exchange = $('input[name=exchange]').val();
	setListen(exchange);

});

Dispatcher.on('requeue', function(item) {
	
	console.log("Requeue requested for: ");
	console.log(item);

	var request = {
		deliveryTag: item.id,
		from: currentQueue,
		to: item.properties.headers['x-death'][0].queue
	};

	$.ajax({
		type: "POST",
		url: location.origin + "/requeue/",
		// The key needs to match your method's input parameter (case-sensitive).
		data: JSON.stringify(request),
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	}).done(itemsChanged.bind(undefined, item.queue));

});

Dispatcher.on('delete', function(item) {
	
	console.log("Delete requested for: ");
	console.log(item);

	var request = {
		deliveryTag: item.id,
		from: currentQueue,
	};

	$.ajax({
		type: "POST",
		url: location.origin + "/delete/",
		// The key needs to match your method's input parameter (case-sensitive).
		data: JSON.stringify(request),
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	}).done(itemsChanged.bind(undefined, item.queue));

});
