(function($){
	/**
		JQuery Taggable Plugin
		Author: Andrew Oberlin
		Date: July 4, 2012
		
		Description: Takes in a picture and allows the user to zoom in and out 
			using the controls created by the zoomable plugin. The user can also drag the
			image around and zoom if they wish to do so. The main focus however is on
			using the canvas element to draw tags assign descriptions to those tags
			and then save the tags for viewing using ajax. Supports rectangular tags and 
			polygonal tags.
		
		Dependencies:
			jQuery 1.7.2 or higher
			jQuery UI 1.8.18 or higher
			zoomable.js and all of its dependencies
			KineticJs 3.10.0
			JsRender with taggableTemplate.js
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
		createStructure: function($parent, $img, originalData, imagesUrl, callback) {
			// create the toolbar
			var id = $img.attr('id');
			
			$parent.prepend(private_methods.renderToolbar(colors, id, imagesUrl)); 
			
			if ($('#taggable-tooltip').length == 0) {
				$parent.parent().append('<div id="taggable-tooltip"></div>');
			}
			
			// creates the tag board and the drawing board
			var $tagBoard = $('<div id="' + id + '-tag-board" class="tag-board"></div>').prependTo($img.parent());
			$tagBoard.draggable();
			var $canvas = $('<canvas id="' + id + '-drawing-board" class="drawing-board"></canvas>').prependTo($img.parent());
			
			// events for clicking the start and stop drawing buttons
			$('#' + id + '-begin-tagging').live('click', function() {
				$(this).siblings('.add-tag-hidden').removeClass('add-tag-hidden').addClass('add-tag');
				$(this).addClass('add-tag-hidden').removeClass('add-tag');
				$('#' + id + '-toolbar-table-container').toggle();
				private_methods.startTagging(id);
			});
			
			$('#' + id + '-end-tagging').live('click', function() {
				$(this).siblings('.add-tag-hidden').removeClass('add-tag-hidden').addClass('add-tag');
				$(this).addClass('add-tag-hidden').removeClass('add-tag');
				$('#' + id + '-toolbar-table-container').toggle();
				private_methods.endTagging(id);
			});
			
			// changes the color of the currently drawn tag or just of the paint brush itself
			$('#' + id + '-color-toolbar button').on('click', function() {
				var $canvas = $('#' + id + '-drawing-board');
				var color = $(this).css('background-color');
				
				var newFillStyle = "";
				if (color != "black") {
					var rgbArr = color.split("(")[1].split(")")[0].split(",");
					if (parseInt($.trim(rgbArr[0])) + parseInt($.trim(rgbArr[1])) + parseInt($.trim(rgbArr[2])) != 0) {
						newFillStyle = "rgba(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ", 0.5)"; 
					}
				}
				$canvas.data('taggingConfig').fillStyle = newFillStyle;
				var points = $canvas.data('points');
				draw_methods.redrawTag($canvas);
			});
			
			// buttons for switching between drawing in rectangular form and polygonal form
			$('#' + id + '-draw-rect').on('click', function() {
				$canvas.data('taggingConfig').shape = 'rect';
				private_methods.startTagging(id);
			});
			
			$('#' + id + '-draw-poly').on('click', function() {
				$canvas.data('taggingConfig').shape = 'poly';
				private_methods.startTagging(id);
			});
			
			// submits the currently drawn tag
			$('#' + id + '-submit-tag').on('click', function() {
				private_methods.saveTag(id);
			});
			
			var left = parseInt($img.css('left').split('px')[0]);
			var top = parseInt($img.css('top').split('px')[0]);
			
			// sizes everything correctly based on the image specifics
			// also draws the original tags if they exist
			$tagBoard.data('tags', (originalData ? originalData : {}));
			private_methods.resizeCanvas(id);
			
			// since the tagBoard has to be above the image we must make it drag the image with it
			$tagBoard.bind('drag', function(event, ui) {
				$img.css('left', $(this).css('left')).css('top', $(this).css('top'));
				$('#' + $img.attr('id') + '-drawing-board').css('left', $(this).css('left')).css('top', $(this).css('top'));
			});
			
			// initializes the configuration data for drawing
			$canvas.data('taggingConfig', {
				fillStyle : '',
				shape : 'rect',
				n: 0,
				mouseDown : false
			});
			
			if (callback) {
				callback();
			}
		},
		/**
		
		**/
		renderToolbar: function(colors, id, imagesUrl) {
			var colorButtons = '';
			for (var i = 0; i < colors.length; i++) {
				colorButtons += '<button class="change-color toolbar-item" style="background-color: ' + colors[i].colorRGB + '"></button>';
			}
			var $render = $('<div class="toolbar-container"> \
					<span> \
						<img class="toolbar-icon" src="' + imagesUrl + 'tag.png"></img> \
					</span> \
					<span> \
						<img id="' + id + '-begin-tagging" class="add-tag toolbar-item" src="' + imagesUrl + 'button-play_green.png"></img> \
						<img id="' + id + '-end-tagging" class="add-tag-hidden toolbar-item" src="' + imagesUrl + 'button-pause_red.png"></img> \
					</span> \
					<span id="' + id + '-toolbar-table-container" class="toolbar-table-container" style="display: none;"> \
						<table cellspacing="0" cellpadding="0"> \
							<thead> \
								<tr> \
									<th>Description</th> \
									<th>Colors</th> \
									<th>Draw Mode</th> \
								</tr> \
							</thead> \
							<tbody> \
								<tr> \
									<td> \
										<form id="' + id + '-description-form" class="desc-form toolbar-item"> \
											<input type="text" name="desc" class="desc" /> \
										</form> \
									</td> \
									<td id="' + id + '-color-toolbar">' + 
										colorButtons + 
									'</td> \
									<td> \
										<button id="' + id + '-draw-rect" class="draw-rect draw-type toolbar-item"> \
											<img height="20px" src="' + imagesUrl + 'rectButtonIcon.png"></img> \
										</button> \
										<button id="'+ id + '-draw-poly" class="draw-poly draw-type toolbar-item"> \
											<img height="20px" src="' + imagesUrl + 'polygonButtonIcon.png"> \
										</button> \
									</td> \
								</tr> \
							</tbody> \
						</table> \
						<button id="' + id + '-submit-tag" class="submit-tag toolbar-item">Submit Tag</button> \
					</span> \
				</div>');
				return $render;
		},
		/**
			Redraws and resizes the canvases based on the image's current
			zoom level
		**/
		resizeCanvas: function(imgId) {
			var $canvas = $('#' + imgId + '-drawing-board');
			var $tagBoard = $('#' + imgId + '-tag-board');
			var $img = $('#' + imgId);
			
			// drawing board
			$canvas.css('left', $img.css('left')).css('top', $img.css('top'));
			$canvas[0].height = $img.height();
			$canvas[0].width = $img.width();
			
			// tag board
			$tagBoard.css('left', $img.css('left')).css('top', $img.css('top'));
			$tagBoard.height($img.height());
			$tagBoard.width($img.width());
			draw_methods.redrawTagBoard($tagBoard);
			
			draw_methods.redrawTag($canvas);
		},
		/**
			Starts the tagging process for the current shape style 
			and moves the drawing board to the top
		**/
		startTagging: function(id) {
			var $canvas = $('#' + id + '-drawing-board');
			$canvas.css('z-index', 500);
			
			var shape = $canvas.data('taggingConfig').shape;
			
			$canvas.off('mousedown');
			$canvas.off('mouseup');
			$canvas.off('mousemove');
			
			$canvas.on('mousedown', draw_methods[shape].start);
			$canvas.on('mouseup', draw_methods[shape].finish);
			$canvas.on('mousemove', draw_methods[shape].move);
		},
		/**
			Stops the tagging process by eliminating events 
			and moving the drawing board to the bottom
		**/
		endTagging: function(id) {
			var $canvas = $('#' + id + '-drawing-board');
			$canvas.css('z-index', 0);
			$canvas.off('mousedown');
			$canvas.off('mouseup');
			$canvas.off('mousemove');
		},
		/**
			Saves a tag using ajax and updates the tags to reflect the change
		**/
		saveTag: function(id) {
			var $canvas = $('#' + id + '-drawing-board');
			var $tagBoard = $('#' + id + '-tag-board');
			var tagPoints = $canvas.data('points');
			
			// gets the 3 color values RGB
			var fillStyle = $canvas.data('taggingConfig').fillStyle;
			var colorArr = fillStyle.split('(')[1].split(')')[0].split(',');
			colorArr.pop();
			for (var i = 0; i < colorArr.length; i++) {
				colorArr[i] = $.trim(colorArr[i])
			}
			
			// gets the current description
			var description = $('#' + id + '-description-form .desc').val();
			
			// adds the current drawn tag to the local tags object
			$tagBoard.data('tags').push({
				color: colorArr,
				points: tagPoints,
				description: description
			});
			
			// updates the tag board
			draw_methods.redrawTagBoard($tagBoard);
		}
	};
	
	var draw_methods = {
		/**
			Methods for drawing a rectangle
		**/
		rect: {
			/**
				Starts the drawing of a new rectangle
			**/
			start: function(event) {
				var point = draw_methods.getCoordinates(event);
				var $canvas = $(event.target);
				
				var points = [];
				points[0] = draw_methods.convertFromZoomToOriginal(point, $canvas);
				$canvas.data('points', points);
				$canvas.data('taggingConfig')['mouseDown'] = true; 
			},
			/**
				Finalizes the drawing of a rectangle when they let go of the mouse
			**/
			finish: function(event) {
				var $canvas = $(event.target);
				
				var point = draw_methods.getCoordinates(event);
				var points = $canvas.data('points');
				points[1] = draw_methods.convertFromZoomToOriginal(point, $canvas);
				$canvas.data('taggingConfig')['mouseDown'] = false; 
			},
			/**
				Event called when the user moves the mouse to update the current rectangle
			**/
			move: function(event) {
				var $canvas = $(event.target);
				var canvas = $canvas[0];
				var taggingConfig = $canvas.data('taggingConfig');
				
				// should do nothing if the mouse is not held down
				if (taggingConfig.mouseDown) {
					// converts the evnts x,y values to create a point that is local to the canvas
					var point = draw_methods.getCoordinates(event);
					
					// since the canvas is most liekly zoomed in we must convert back to original points for
					// storing so that they can be properly scaled and stored through ajax later
					point = draw_methods.convertFromZoomToOriginal(point, $canvas);
					$canvas.data('points')[1] = point;
					
					// converts the points array to an array of zoomed points instead
					var points = $canvas.data('points');
					var drawPoints = [];
					for (var i = 0; i < points.length; i++) {
						drawPoints[i] = draw_methods.convertFromOriginalToZoom(points[i], $canvas);
					}
					
					// draws the rectangle
					draw_methods.drawRect(drawPoints, $canvas, taggingConfig.fillStyle, true);
				}
			}
		},
		/**
			Methods for drawing a polygon
		**/
		poly: {
			/**
				Starts the drawing of a polygon
			**/
			start: function(event) {
				var point = draw_methods.getCoordinates(event);
				var $canvas = $(event.target);
				
				$canvas.data('points', []);
				var points = $canvas.data('points');
				points[0] = draw_methods.convertFromZoomToOriginal(point, $canvas);
				$canvas.data('taggingConfig').n = 1;
				$canvas.data('taggingConfig')['mouseDown'] = true; 
			},
			/**
				Finishes the drawing of a polygon
			**/
			finish: function(event) {
				var $canvas = $(event.target);
				
				var point = draw_methods.getCoordinates(event);
				$canvas.data('points').push(draw_methods.convertFromZoomToOriginal(point, $canvas));
				$canvas.data('taggingConfig')['mouseDown'] = false; 
			},
			/**
				Event called when the user moves the mouse to update the current polygon
			**/
			move: function(event) {
				var $canvas = $(event.target);
				var taggingConfig = $canvas.data('taggingConfig');
				
				// should only be called when the mouse is down and should not
				// be called every time because it will produce too many points
				if (taggingConfig.mouseDown && taggingConfig.n % 8 == 1) {
					// converts the events x,y values to create a point that is local to the canvas
					var point = draw_methods.getCoordinates(event);
					
					// since the canvas is most likely zoomed in we must convert back to original points for
					// storing so that they can be properly scaled and stored through ajax later
					point = draw_methods.convertFromZoomToOriginal(point, $canvas);
					$canvas.data('points').push(point);
					
					// converts the points array to an array of zoomed points instead
					var points = $canvas.data('points');
					var drawPoints = [];
					for (var i = 0; i < points.length; i++) {
						drawPoints[i] = draw_methods.convertFromOriginalToZoom(points[i], $canvas);
					}
					
					// draws the polygon
					draw_methods.draw(drawPoints, $canvas, taggingConfig.fillStyle, true);
				}
			}
		},
		/**
			Takes the event's coordinatesand converts them to be relative to the
			image's position for correct drawing position
		**/
		getCoordinates: function(event) {
			var posX = 0;
			var posY = 0;
			var $canvas = $(event.target);
			
			// finds the exact position of the canvas on the page
			var imgPos = draw_methods.findPosition($canvas[0]);
			if (!event) var event = window.event;
			if (event.pageX || event.pageY) {
				posX = event.pageX;
				posY = event.pageY;
			}
			else if (event.clientX || event.clientY) {
				posX = event.clientX + document.body.scrollLeft
					+ document.documentElement.scrollLeft;
				posY = event.clientY + document.body.scrollTop
					+ document.documentElement.scrollTop;
			}
			// finds the relative position
			posX = posX - imgPos[0];
			posY = posY - imgPos[1];
			return [posX, posY]; 
		},
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
			events for these polygons
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
				var leftMin = 10000000;
				var leftMax = -1;
				var topMax = -1;
				for (var j = 0; j < drawPoints.length; j++) {
					if (drawPoints[j][0] < leftMin) {
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
					pos[1] -= $(window).scrollTop() - 20;
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
			Redraws the current tag on the drawing board so that it is not affected
			by the zooming in and out
		**/
		redrawTag: function($canvas) {
			if ($canvas.data('points') && $canvas.data('points').length >= 2) {
				// converts the points to be at the correct zoom level
				var points = $canvas.data('points');
				var drawPoints = [];
				for (var i = 0; i < points.length; i++) {
					drawPoints[i] = draw_methods.convertFromOriginalToZoom(points[i], $canvas);
				}
				
				// checks to see if its is a rectangle
				if (drawPoints.length == 2) {
					var otherPoints = draw_methods.getOtherRectPoints(drawPoints);
					drawPoints[2] = drawPoints[1];
					drawPoints[1] = otherPoints[0];
					drawPoints[3] = otherPoints[1];
				}
				
				// draws the points
				draw_methods.draw(drawPoints, $canvas, $canvas.data('taggingConfig').fillStyle, true);
			}
		},
		/**
			Proxy method for drawing a rectangle specifically
		**/
		drawRect: function(points, $canvas, fillStyle, refresh) {
			var drawPoints = [points[0], points[1]];
			var otherPoints = draw_methods.getOtherRectPoints(drawPoints);
			drawPoints[2] = drawPoints[1];
			drawPoints[1] = otherPoints[0];
			drawPoints[3] = otherPoints[1];
			draw_methods.draw(drawPoints, $canvas, fillStyle, refresh);
		},
		/**
			Takes an array of points and draws them to the canvas
		**/
		draw: function(points, $canvas, fillStyle, refresh) {
			var canvas = $canvas[0];
			// checks to see if the canvas should be refreshed
			if (refresh) {
				canvas.width = canvas.width;
			}
			var context = canvas.getContext("2d");
			
			// goes through each point and draws the polygon
			context.beginPath();
			context.moveTo(points[0][0], points[0][1]);
			for (var i = 1; i < points.length; i++) {
				context.lineTo(points[i][0], points[i][1]);    
			}
			context.closePath();
			
			if (fillStyle != "") {
				context.fillStyle = fillStyle;
				context.fill();
			}
			context.stroke(); 
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
				if (options.imagesUrl[0] != '/') {
					options.imagesUrl += '/';
				}
				
				$.extend(args, options);
				$(this).zoomable({
					callback: private_methods.createStructure,
					callback_args: [$parent, $(this), args.originalData, options.imagesUrl, options.callback],
					zoom_callback: private_methods.resizeCanvas,
					zoom_callback_args: [$(this).attr('id')],
					alreadyLoaded: options.alreadyLoaded
				});
			});
		}
	};

	$.fn.taggable = function(method) {

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

