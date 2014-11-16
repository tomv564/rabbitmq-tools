var Dispatcher = require("./dispatcher");


var QueueItemDisplay = React.createClass({
	render: function() {
		return (
			<li className="row">

				<div className="col-xs-12 col-sm-8">
			 		<pre className="content">{this.getContent()}</pre>
			 	</div>

			 	<div className="col-xs-6 col-sm-3">
					
					{this.hasXDeath() ? 
						<p>
							<strong>Time</strong>: {this.getTime()}<br/>
							<strong>Queue</strong>: {this.props.item.properties.headers['x-death'][0].queue}<br/>
							<strong>Exchange</strong>: {this.props.item.properties.headers['x-death'][0].exchange}<br/>
							<strong>Routing key</strong>: {this.props.item.properties.headers['x-death'][0]['routing-keys']}
						</p>
						: <p><strong>Routing key</strong>: {this.props.item.routingKey} </p> }

				</div>
				<div className="col-xs-6 col-sm-1">
					{this.hasXDeath() ? 
						<div className="btn-group-vertical btn-group-sm" role="group" aria-label="...">
							<button type="button" className="btn btn-default" onClick={this.onRequeue}>Requeue</button>
							<button type="button" className="btn btn-danger" onClick={this.onDelete}>Delete</button>
						</div> :
						<p></p> }
				</div>
			 </li>
			);
	},
	onRequeue: function(event) {
		Dispatcher.trigger('requeue', this.props.item);
	},
	onDelete: function(event) {
		Dispatcher.trigger('delete', this.props.item);
	},
	hasXDeath: function() {
		return this.props.item.properties.headers && this.props.item.properties.headers['x-death'];
	},
	getContent: function() {
		var json = null;
		try{
			json = JSON.parse(this.props.item.content);
		} catch(e) {
			return this.props.item.content;
		}
		return JSON.stringify(json, null, 2);
	},
	getTime: function() {

		var timestamp = this.props.item.properties.headers['x-death'][0].time.value;
		var date = new Date(timestamp*1000);

		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

	}


});

var QueueuItemList = React.createClass({ 

  render: function() { 
    

      if (this.props.messages == null)
      	return <div className="alert alert-danger">Queue does not exist</div>

      var listitems = this.props.messages.map(function(msg){
      	return <QueueItemDisplay key={msg.id} item={msg}/>;
      });
      return listitems.length > 0 ? <ul className="messages list-unstyled">{listitems}</ul> :
      								<div className="alert alert-warning">No items found</div>
    
  } 

}); 

module.exports = QueueuItemList;