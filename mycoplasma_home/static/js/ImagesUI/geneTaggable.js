/**
 * UI for making tags link to genes in the database 
 * 
 * Author: Andrew Oberlin
 * Date: October 19, 2012
 * 
 * Dependencies:
 *     1. Taggable.js and all of its dependencies
 *     
**/
(function($){
	
	/**
	 * Methods available to the UI programmer to access the states of the 
	 * UI.
	**/
	var publicMethods = {
		init : function(options) {
			return this.each(function() {
				// only accepts objects that are already taggable
				// also requires the container option in options
				// in order to implement the UI correctly
				if ($(this).taggable("isTaggable") && options.container) {
					var $container = $(options.container);
					
					// add a title if pne is provided
					if (options.title) {
						$container.append('<div class="gene-tagging-title">' + options.title + '<span></span></div>');
					}
					
					$container.append('<div class="current-gene-tags"></div>')
					
					$(this).data("geneTaggingInfo", {
						
					});
					
				}
				else {
					console.error("Called geneTaggable on something that is not taggable or did not provide a container to put the UI inside of");
				}
			});
		}
	};
	
	/**
	 * Methods not available to the UI programmer used as helper methods 
	**/
	var privateMethods = {
		
	};
	
	$.fn.geneTaggable = function(method) {

		// Method calling logic
		if ( public_methods[method] ) {
			return public_methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} 
		else if ( typeof method === 'object' || ! method ) {
			return public_methods.init.apply( this, arguments );
		} 
		else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
		}  
	};
})( jQuery );