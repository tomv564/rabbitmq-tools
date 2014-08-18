var QueueItemList = require("./queueitems");
var Dispatcher = require("./dispatcher");
var queue;


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




function reload() {
	 var queue = $('input[name=queue]').val();
	$.getJSON('http://localhost:3000/queues/' + queue + '/items', null).done(showItems);
}

//reload();

$('form').on('submit', function(event) {

 event.preventDefault();

 reload();
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
