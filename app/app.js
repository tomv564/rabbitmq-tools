var QueueItemList = require("./queueitems");
var Dispatcher = require("./dispatcher");
var currentQueue;

function setQueue(queue) {

  currentQueue = queue;

  router.navigate('peek/' + queue);
	document.title = "Peek Queue: " + queue;
  reload();
}

function reload() {
	$.getJSON('/queues/' + currentQueue + '/items', null)
		.done(showItems)
		.fail(showItems.bind(undefined, null));
}

function startPinging() {
var host = location.origin.replace(/^http/, 'ws')
      var ws = new WebSocket(host);
      ws.onmessage = function (event) {
        var li = document.createElement('li');
        li.innerHTML = JSON.parse(event.data);
        document.querySelector('#pings').appendChild(li);
      };
}

var Router = Backbone.Router.extend({

  routes: {
    "peek/:queue":        "peek",  
  }

});

$('button#purge').on('click', startPinging);

var router = new Router();

router.on('route:peek', function(queue) {
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

function itemRequeued() {
	console.log("requeue done");
	reload();
}

$('form').on('submit', function(event) {

	event.preventDefault();
	var queue = $('input[name=queue]').val();
	setQueue(queue);

});

Dispatcher.on('requeue', function(item) {
	
	console.log("Requeue requested for: ");
	console.log(item);

	var request = {
		deliveryTag: item.id,
		from: 'dead',
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
	}).done(itemRequeued.bind(undefined, item.queue));

});
