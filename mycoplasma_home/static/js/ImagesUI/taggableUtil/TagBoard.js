/*
 -------------------------------------------------------------------------------------
 					Drawing object for the Tag Board (uses KineticJS)
 					
 					Dependencies:
 						1. jQuery 1.7.2
 						2. Utilities.js in the taggableUtil package
 						3. KineticJs v3.10.0
 						4. Tag.js in the taggableUtil package
 -------------------------------------------------------------------------------------
*/
function TagBoard(tagBoard, originalData, image, organisms, siteUrl, defaultInfoViewCallback) {
	this.board = tagBoard;
	this.image = image;
	this.organisms = organisms;
	this.tagGroups = this.__convertOriginalDataToTagGroups(originalData);
	this.stage = null;
	this.layer = null;
	this.locked = false;
	this.selectedTag = null;
	this.tagsVisible = true;
	this.currentTagGroups = {};
	if (this.tagGroups.length > 0) {
		var key = this.tagGroups[0].getKey();
		this.currentTagGroups[key] = this.tagGroups[0];
	}
	this.siteUrl = siteUrl;
	this.defaultInfoViewCallback = defaultInfoViewCallback;
	this.visibleShapes = [];
};

TagBoard.prototype.getBoard = function() {
	return this.board;
};

TagBoard.prototype.getTagGroups = function() {
	return this.tagGroups;
};

TagBoard.prototype.addTag = function(color, points, description, callback, errorCallback) {
	var tag = new Tag(color, points, description, this.image.attr('id'), this.siteUrl, null);
	
	var keys = [];
	
	for (key in this.currentTagGroups) {
		if (this.currentTagGroups.hasOwnProperty(key)) {
			keys.push(key);
		}
	}
	
	// saves the tag and then adds the 
	tag.save(
		Util.scopeCallback(this, function() {
			for (key in this.currentTagGroups) {
				if (this.currentTagGroups.hasOwnProperty(key)) {
					var tagCopy = tag.copy();
					tagCopy.setTagGroup(this.currentTagGroups[key]);
					this.currentTagGroups[key].addTag(tagCopy);
				}
			}
			
			this.redraw();
			
			callback();
		}),
		function(errorMessage) {
			errorCallback(errorMessage);
		},
		keys
	);
};

TagBoard.prototype.redraw = function() {
	this.locked =  false;
	var id = this.image.attr('id');
	
	// check to see if a stage has been initialized
	if (!this.stage) {
		// create a new one
		this.stage = new Kinetic.Stage({
			container: this.board[0],
			width: this.board.width(),
			height: this.board.height()
		});
	}
	else {
		// clear the original stage and resize it
		this.stage.setSize(this.board.width(), this.board.height());
		this.stage.removeChildren();
	}
	
	this.layer = new Kinetic.Layer();
	for (var key in this.currentTagGroups) {
	  if (this.currentTagGroups.hasOwnProperty(key)) {
		  var tags = this.currentTagGroups[key].getTags();
		  // Draws the tags on the board and sets up mouseover and mouseout events
		  for (var i = 0; i < tags.length; i++) {
			  this.layer.add(this.__createPolyFromTag(tags[i], i));
		  }
		  
		  this.stage.add(this.layer);
	  }
	}
	
	this.board.on('mousemove', Util.scopeCallback(this, this.boardMouseMove));
};

TagBoard.prototype.toggleTags = function() {
	this.tagsVisible = !this.tagsVisible;
	this.redraw();
};

TagBoard.prototype.__createPolyFromTag = function(tag, i) {
	// gets the color unless it is black, because that is code for transparent drawing
	var color = tag.getFormattedColor();
	
	// converts the tag's points to the current zoom level
	var drawPoints = [];
	for (var j = 0; j < tag.getPoints().length; j++) {
		drawPoints[j] = TaggableUtil.convertFromOriginalToZoom(tag.getPoints()[j], this.image);
	}
	
	// checks if the points represent a rectangle and fixes the array to be a four point
	// array in the correct order for drawing
	if (drawPoints.length == 2) {
		var otherPoints = TaggableUtil.getOtherRectPoints(drawPoints);
		drawPoints[2] = drawPoints[1];
		drawPoints[1] = otherPoints[0];
		drawPoints[3] = otherPoints[1];
	}
	
	var fill = "";
	if (this.tagsVisible) {
		fill = color;
	}
	
	// creates a polygon with the points for this tag
	var poly = new Kinetic.Polygon({
		points: $.map( drawPoints, function(n){return n;}),
		fill: fill,
		stroke: "rgba(255,255,255,0)",
		strokeWidth: 1
	});
	
	// sets the color and description for this polygon
	poly.color = color;
	poly.description = tag.getDescription();
	poly.setId(i);
	
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
	//poly.on('mouseover', Util.scopeCallback(this, this.polyOnMouseOver));
	
	// hides the polygon and its tooltip
	//poly.on('mouseout', Util.scopeCallback(this, this.polyOnMouseOut));
	
	// toggles the mouseout event for this poly
	// and the mouseover events for all other poly's
	poly.on('click', Util.scopeCallback(this, this.polyOnClick));
	
	return poly;
};

TagBoard.prototype.polyOnClick = function(event) {
	this.locked = !this.locked;
};

TagBoard.prototype.polyOnMouseOut = function(event) {
	if (!this.locked && this.lastMousePos != null) {
		var collidingShapes = this.stage.getIntersections(this.lastMousePos);
		
		for (var i = 0; i < collidingShapes.length; i++) {
			// draws the shape on mouse over
			collidingShapes[i].attrs.fill = this.tagsVisible ? collidingShapes[i].color : "";
			collidingShapes[i].attrs.stroke = "rgba(255,255,255,0)";
			var shape = event.shape;
			// positions the tag tooltip
			var pos = this.__getPolyPos(event.shape);
			pos[0] -= $('#taggable-tooltip').html(shape.description).width()/2;
			pos[1] -= $(window).scrollTop() - 20;
			$('#taggable-tooltip').css("left", pos[0] + "px").css("top", pos[1] + "px").show();
		}
		
		// hides the tooltip and redraws the layer
		$('#taggable-tooltip').hide();
		this.layer.draw();
		
	}
};

TagBoard.prototype.boardMouseMove = function(event) {
	if (!this.locked) {		
		var mousePos = this.stage.getMousePosition(event);
		
		if (!this.tagsVisible && this.visibleShapes.length > 0) {
			for (var i = 0; i < this.visibleShapes.length; i++) {
				// draws the shape on mouse over
				this.visibleShapes[i].attrs.fill = "";
				this.visibleShapes[i].attrs.stroke = "rgba(255,255,255,0)";
			}
			this.tagsVisible.length = 0;
		}
		
		this.lastMousePos = mousePos;
		
		this.visibleShapes = this.stage.getIntersections(mousePos);
		
		for (var i = 0; i < this.visibleShapes.length; i++) {
			// draws the shape on mouse over
			this.visibleShapes[i].attrs.fill = this.visibleShapes[i].color;
			this.visibleShapes[i].attrs.stroke = "black";
			/*
			var shape = event.shape;
			// positions the tag tooltip
			var pos = this.__getPolyPos(event.shape);
			pos[0] -= $('#taggable-tooltip').html(shape.description).width()/2;
			pos[1] -= $(window).scrollTop() - 20;
			$('#taggable-tooltip').css("left", pos[0] + "px").css("top", pos[1] + "px").show();*/
		}
 
		this.layer.draw();
		
		// sets the selected tag for showing information
		//var shapeId = event.shape.getId();
		//this.selectedTag = this.tagGroups[this.currentTagGroup].getTags()[shapeId];
		//this.defaultInfoViewCallback(tags, shapeId, id);
	}
};

TagBoard.prototype.polyOnMouseOver = function(event) {
	if (!this.locked) {		
		var mousePos = this.stage.getMousePosition(event);
		this.lastMousePos = mousePos;
		
		var collidingShapes = this.stage.getIntersections(mousePos);
		
		for (var i = 0; i < collidingShapes.length; i++) {
			// draws the shape on mouse over
			collidingShapes[i].attrs.fill = collidingShapes[i].color;
			collidingShapes[i].attrs.stroke = "black";
			var shape = event.shape;
			// positions the tag tooltip
			var pos = this.__getPolyPos(event.shape);
			pos[0] -= $('#taggable-tooltip').html(shape.description).width()/2;
			pos[1] -= $(window).scrollTop() - 20;
			$('#taggable-tooltip').css("left", pos[0] + "px").css("top", pos[1] + "px").show();
		}
 
		this.layer.draw();
		
		// sets the selected tag for showing information
		var shapeId = event.shape.getId();
		//this.selectedTag = this.tagGroups[this.currentTagGroup].getTags()[shapeId];
		//this.defaultInfoViewCallback(tags, shapeId, id);
	}
};

TagBoard.prototype.__getPolyPos = function(poly) {
	var pos = TaggableUtil.findPosition(this.board[0]);
	return [pos[0] + poly.pos[0], pos[1] + poly.pos[1]];
};

TagBoard.prototype.__convertOriginalDataToTagGroups = function(originalData) {
	var tagGroups = [];
	
	for (group in originalData['tagGroups']) {
		tagGroups.push(new TagGroup(originalData['tagGroups'][group], this.image.attr('id'), this.siteUrl));
	}
	
	return tagGroups;
};

TagBoard.prototype.addToCurrentTagGroups = function(tagGroup) {
	this.currentTagGroups[tagGroup.key] = tagGroup;
	this.redraw();
};

TagBoard.prototype.removeFromCurrentTagGroups = function(tagGroup) {
	delete this.currentTagGroups[tagGroup.key];
	this.redraw();
};

TagBoard.prototype.addNewTagGroup = function(name, callback, errorCallback) {
	var self = this;
	$.ajax({
		url: this.siteUrl + 'administration/addNewTagGroup',
		type: 'POST',
		dataType: 'json',
		data: {
			imageKey: self.image.attr('id'),
			name: name
		},
		success: function(data, textStatus, jqXHR) {
			if (!data.error) {				
				// add a new tag group
				var newTagGroup = new TagGroup(data.tagGroup, self.image.attr('id'), self.siteUrl);
				self.tagGroups.push(newTagGroup);
				self.addToCurrentTagGroups(newTagGroup);
				if (callback) {
					callback();
				}
			}
			else {
				errorCallback(data.errorMessage);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			errorCallback(textStatus);
		}
	});
};

TagBoard.prototype.getCurrentTagGroups = function() {
	return this.currentTagGroups;
};