/**
 * @jsx React.DOM
 */

var Dispatcher = require("./dispatcher");


var QueueItemDisplay = React.createClass({
	render: function() {
		return (
			<li className="queueitem row">
				<div className="col-xs-1">
					{this.hasXDeath() ? 
						<button type="button" className="btn btn-default" onClick={this.onClick}>Requeue</button> :
						<p></p> }
				</div>
				<div className="col-xs-3">
					
					{this.hasXDeath() ? 
						<p>
							<strong>Queue</strong>: {this.props.item.properties.headers['x-death'][0].queue}<br/>
							<strong>Exchange</strong>: {this.props.item.properties.headers['x-death'][0].exchange}<br/>
							<strong>Routing keys</strong>: {this.props.item.properties.headers['x-death'][0]['routing-keys']}
						</p>
						: <p></p>}
					
				</div>
				<div className="col-xs-8">
			 		<pre>{this.props.item.content}</pre>
			 	</div>
			 </li>
			);
	},
	onClick: function(event) {
		Dispatcher.trigger('requeue', this.props.item);
	},
	hasXDeath: function() {
		return this.props.item.properties.headers['x-death'];
	}


});

var QueueuItemList = React.createClass({ 

  render: function() { 
    
      var listitems = this.props.messages.map(function(msg){
      	return <QueueItemDisplay item={msg}/>;
      });
      return listitems.length > 0 ? <ul className="list-unstyled">{listitems}</ul> :
      								<p>No items found</p>
    
  } 

}); 

module.exports = QueueuItemList;