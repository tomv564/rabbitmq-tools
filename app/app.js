var QueueItemList = require("./queueitems");
var Dispatcher = require("./dispatcher");
var currentQueue;

function setQueue(queue) {

  currentQueue = queue;

  router.navigate('manage/' + queue);
  document.title = "Peek Queue: " + queue;
  
  reload();

}

function reload() {
	$.getJSON('/queues/' + currentQueue + '/items', null)
		.done(showItems)
		.fail(showItems.bind(undefined, null));
}

function startListening() {
	var host = location.origin.replace(/^http/, 'ws');
	var data = [];
      var ws = new WebSocket(host);
      ws.onmessage = function (event) {
        //var li = document.createElement('li');
        //li.innerHTML = JSON.parse(event.data);
        //document.querySelector('#pings').appendChild(li);
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

$('button#purge').on('click', startListening);

var router = new Router();

router.on('route:manage', function(queue) {
		$('input[name=queue]').val(queue);
        setQueue(queue); 
    });

Backbone.history.start({pushState: true});


function showItems(data) {
	React.renderComponent(
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
	console.log("todo: start listening to " + exchange);

});

Dispatcher.on('requeue', function(item) {
	
	console.log("Requeue requested for: ");
	console.log(item);

	var request = {
		deliveryTag: item.id,
		from: currentQueue,
		to: item.properties.headers['x-death'][0].queue
	};

	//$.post('http://localhost:3000/requeue/', request).done(itemRequeued);

	$.ajax({
		type: "POST",
		url: "http://localhost:3000/requeue/",
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
		url: "http://localhost:3000/delete/",
		// The key needs to match your method's input parameter (case-sensitive).
		data: JSON.stringify(request),
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	}).done(itemsChanged.bind(undefined, item.queue));

});
