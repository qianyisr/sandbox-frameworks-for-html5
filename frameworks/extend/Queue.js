define(function(require, exports, module) {

	function Queue (queue) {
	    this._queue = [];

	    if ( queue && queue.length ) {
	    	this.add(queue);
	    }

	    return this;
	}

	Queue.prototype = {

	    limit : function (n) {
	    	if ( n ) this._limit = n;

	    	if ( this._queue.length > this._limit ) {

	    		var i = 0,
	    			l = this._queue.length - this._limit;

	    		while ( i < l ) {
	    			this._queue.shift();
	    			i++;
	    		}
	    	}

	    	return this;
	    },

	    add : function () {
	      	var l = arguments.length,
	          	queue;

	      	for ( var i = 0; i <= l; i++ ) {
	          	queue = arguments[i];

	          	if ( queue === undefined ) continue;

	          	if ( typeof queue === "object" && queue.length ) {
	          		this._queue.concat(queue);
	          	} else {
	          		this._queue.push(queue);
	          	}

	      	}

	      	this.limit();

	      	return this;
	    },

	    clear : function () {
	    	this._queue = [];

	    	return this;
	    },

	    get : function () {
	    	return this._queue;
	    }
	}


	return Queue;

})