(function($){
	/**
		JQuery Taggable Viewer Plugin
		Author: Andrew Oberlin
		Date: August 7, 2012
		
		Description: Takes in a picture and allows the user to zoom in and out 
			using the controls created by the zoomable plugin. The user can also drag the
			image around and zoom if they wish to do so. The main focus however is on
			using the canvas element to show tags assign descriptions to those tags. 
			Supports rectangular tags and polygonal tags.
		
		Dependencies:
			jQuery 1.7.2 or higher
			jQuery UI 1.8.18 or higher
			zoomable.js and all of its dependencies
			KineticJs 3.10.0
			taggable.css
	**/   
	var colors = [
		{ colorRGB : 'rgb(255, 0, 0)'},
		{ colorRGB : 'rgb(0, 0, 255)'},
		{ colorRGB : 'rgb(0, 255, 255)'},
		{ colorRGB : 'rgb(0, 98, 0)'},
		{ colorRGB : 'rgb(0, 255, 0)'},
		{ colorRGB : 'rgb(255, 255, 0)'},
		{ colorRGB : 'rgb(192, 192, 192)'},
		{ colorRGB : 'rgb(0, 0, 0)'}
	];
	
	var private_methods = {
		/**
			Creates the structure for the plugin by rendering the toolbar. It creates two
			canvases, one for drawing and teh other for the mouseover events of the tags that already
			exist. 
		**/
		createStructure: function($parent, $img, originalData) {
			// create the toolbar
			var id = $img.attr('id');
			
			$parent.parent().append('<div id="taggable-tooltip"></div>');
			
			// creates the tag board and the drawing board
			var $tagBoard = $('<div id="' + id + '-tag-board" class="tag-board"></div>').prependTo($img.parent());
			$tagBoard.draggable();
			
			var left = parseInt($img.css('left').split('px')[0]);
			var top = parseInt($img.css('top').split('px')[0]);
			
			// sizes everything correctly based on the image specifics
			// also draws the original tags if they exist
			$tagBoard.data('tags', (originalData ? originalData : {}));
			private_methods.resizeCanvas(id);
			
			// since the tagBoard has to be above the image we must make it drag the image with it
			$tagBoard.bind('drag', function(event, ui) {
				$img.css('left', $(this).css('left')).css('top', $(this).css('top'));
			});
		},
		/**
			Redraws and resizes the canvases based on the image's current
			zoom level
		**/
		resizeCanvas: function(imgId) {
			var $tagBoard = $('#' + imgId + '-tag-board');
			var $img = $('#' + imgId);
			
			// tag board
			$tagBoard.css('left', $img.css('left')).css('top', $img.css('top'));
			$tagBoard.height($img.height());
			$tagBoard.width($img.width());
			draw_methods.redrawTagBoard($tagBoard);
		}
	};
	
	var draw_methods = {
		/**
			Finds the exact position of an element on the page
		**/
		findPosition: function(oElement) {
			if(typeof( oElement.offsetParent ) != "undefined") {
				for(var posX = 0, posY = 0; oElement; oElement = oElement.offsetParent) {
					posX += oElement.offsetLeft;
					posY += oElement.offsetTop;
				}
				return [ posX, posY ];
			}
			
			return [ oElement.x, oElement.y ];
		}, 
		/**
			Often a rectangle is expressed as two points opposite each other
			This will find the other two points for easier drawing
		**/
		getOtherRectPoints: function(points_arr) {
			var pointOne, pointTwo;
			if (points_arr[0][0] < points_arr[1][0] && points_arr[0][1] < points_arr[1][1]) {
				pointOne = [points_arr[0][0], points_arr[1][1]];
				pointTwo = [points_arr[1][0], points_arr[0][1]];
			}
			else if (points_arr[0][0] > points_arr[1][0] && points_arr[0][1] > points_arr[1][1]) {
				pointOne = [points_arr[1][0], points_arr[0][1]];
				pointTwo = [points_arr[0][0], points_arr[1][1]];
			}
			else if (points_arr[0][0] < points_arr[1][0] && points_arr[0][1] > points_arr[1][1]) {
				pointOne = [points_arr[0][0], points_arr[1][1]];
				pointTwo = [points_arr[1][0], points_arr[0][1]];
			}
			else {
				pointOne = [points_arr[1][0], points_arr[0][1]];
				pointTwo = [points_arr[0][0], points_arr[1][1]];
			}
			return [pointOne, pointTwo]; 
		},
		/**
			Uses KineticJs to redraw the tag board to fit the current scale of the image
			and converts the tag points to the current zoom level. Also, starts the mouseover
			events for these polugons
		**/
		redrawTagBoard: function($tagBoard) {
			var tags = $tagBoard.data('tags');
			
			// check to see if a stage has been initialized
			var stage;
			if (!$tagBoard.data('stage')) {
				// create a new one
				stage = new Kinetic.Stage({
					container: $tagBoard[0],
					width: $tagBoard.width(),
					height: $tagBoard.height()
				});
			}
			else {
				// clear the original stage and resize it
				stage = $tagBoard.data('stage');
				stage.setSize($tagBoard.width(), $tagBoard.height());
				stage.removeChildren();
			}
			
			var layer = new Kinetic.Layer();
			
			// Draws the tags on the board and sets up mouseover and mouseout events
			for (var i = 0; i < tags.length; i++) {
				// gets the color unless it is black, because that is code for transparent drawing
				var color = '';
				if (tags[i].color[0] + tags[i].color[1] + tags[i].color[2] != 0) {
					color = 'rgba(' + tags[i].color.join() + ',0.5)';
				}
				
				// converts the tag's points to the current zoom level
				var drawPoints = [];
				for (var j = 0; j < tags[i].points.length; j++) {
					drawPoints[j] = draw_methods.convertFromOriginalToZoom(tags[i].points[j], $tagBoard);
				}
				
				// checks if the points represent a rectangle and fixes the array to be a four point
				// array in the correct order for drawing
				if (drawPoints.length == 2) {
					var otherPoints = draw_methods.getOtherRectPoints(drawPoints);
					drawPoints[2] = drawPoints[1];
					drawPoints[1] = otherPoints[0];
					drawPoints[3] = otherPoints[1];
				}
				
				// creates a polygon with the points for this tag
				var poly = new Kinetic.Polygon({
					points: $.map( drawPoints, function(n){return n;}),
					fill: "",
					stroke: "rgba(255,255,255,0)",
					strokeWidth: 1
				});
				
				// sets the color and description for this polygon
				poly.color = color;
				poly.description = tags[i].description;
				
				// finds the position of the tooltip for this polygon
				// should be centered in the middle of the polygon and below it
				var leftMin = -1;
				var leftMax = -1;
				var topMax = -1;
				for (var j = 0; j < drawPoints.length; j++) {
					if (drawPoints[j][0] < leftMin || leftMin == -1) {
						leftMin = drawPoints[j][0];
					}
					
					if (drawPoints[j][0] > leftMax) {
						leftMax = drawPoints[j][0];
					}
					
					if (drawPoints[j][1] > topMax) {
						topMax = drawPoints[j][1];
					}
				}
				
				poly.pos = [(leftMin + leftMax)/2, topMax];
				
				// shows the polygon and its tooltip
				poly.on('mouseover', function(evt) {
					evt.shape.attrs.fill = evt.shape.color;
					evt.shape.attrs.stroke = "black";
					var shape = evt.shape;
					var pos = draw_methods.getPolyPos(evt.shape, $tagBoard);
					pos[0] -= $('#taggable-tooltip').html(shape.description).width()/2;
					$('#taggable-tooltip').css("left", pos[0] + "px").css("top", pos[1] + "px").show(); 
					layer.draw();
				});
				
				// hides the polygon and its tooltip
				poly.on('mouseout', function(evt) {
					evt.shape.attrs.fill = "";
					evt.shape.attrs.stroke = "rgba(255,255,255,0)";
					$('#taggable-tooltip').hide();
					layer.draw();
				});
				
				layer.add(poly);
			}
			
			stage.add(layer);
			
			$tagBoard.data('stage', stage);
		},
		/**
			Gets the exact position of the polygon on the page
		**/
		getPolyPos: function(poly, $tagBoard) {
			var pos = draw_methods.findPosition($tagBoard[0]);
			return [ pos[0] + poly.pos[0], pos[1] + poly.pos[1]];
		},
		/**
			Converts a points from the original dimensions to the current zoom level's
			dimensions. Relies heavily on the zoomable plugin
		**/
		convertFromOriginalToZoom: function(point, $canvas) {
			var $img = $canvas.siblings('.zoomable-src');
			var scale = $img.height()/$img.data('originalHeight');
			return [point[0]*scale, point[1]*scale];
		},
		/**
			Converts a points from the current zoom level's dimensions to the original
			dimensions. Relies heavily on the zoomable plugin
		**/
		convertFromZoomToOriginal: function(point, $canvas) {
			var $img = $canvas.siblings('.zoomable-src');
			var scale = $img.data('originalHeight')/$img.height();
			return [point[0]*scale, point[1]*scale];
		}
	};
	
	var public_methods = {
		init: function(options) {
			return this.each(function() {
				var args = { originalData: []};
				
				var $parent;
				if (options.parent) {
					$parent = options.parent;
				}
				else {
					$parent = $(this).parent();
				}
				
				$.extend(args, options);
				$(this).zoomable({
					callback: private_methods.createStructure,
					callback_args: [$parent, $(this), args.originalData],
					zoom_callback: private_methods.resizeCanvas,
					zoom_callback_args: [$(this).attr('id')]
				});
			});
		}
	};

	$.fn.tagViewer = function(method) {

		// Method calling logic
		if ( public_methods[method] ) {
			return public_methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} 
		else if ( typeof method === 'object' || ! method ) {
			return public_methods.init.apply( this, arguments );
		} 
		else {
			$.error( 'Method ' +  method + ' does not exist on tagViewer' );
		}  
	};
})( jQuery );

