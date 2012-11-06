/*
 -------------------------------------------------------------------------------------
 						Static utility methods for general javascript
 -------------------------------------------------------------------------------------
*/
var Util = {};

Util.scopeCallback = function(scope, fn) {
	return function() {
		fn.apply(scope, arguments);
	};
};