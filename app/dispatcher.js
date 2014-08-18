

var Dispatcher = function() {

	var instance =  {};

	_.extend(instance, Backbone.Events);

	return instance;

}();


module.exports = Dispatcher;