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
	this.currentTagGroup = 0;
	this.siteUrl = siteUrl;
	this.defaultInfoViewCallback = defaultInfoViewCallback;
};

TagBoard.prototype.getBoard = function() {
	return this.board;
};

TagBoard.prototype.addTag = function(color, points, description) {
	var tag = new Tag(color, points, description, this.image.attr('id'), this.siteUrl);
	
	// saves the tag and then adds the 
	tag.save(
		Util.scopeCallback(this, function() {
			this.tagGroups[this.currentTagGroup].addTag(tag);
		})
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
	
	var tags = this.tagGroups[this.currentTagGroup].getTags();
	// Draws the tags on the board and sets up mouseover and mouseout events
	for (var i = 0; i < tags.length; i++) {
		this.layer.add(this.__createPolyFromTag(tags[i], i));
	}
	
	this.stage.add(this.layer);
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
	
	// creates a polygon with the points for this tag
	var poly = new Kinetic.Polygon({
		points: $.map( drawPoints, function(n){return n;}),
		fill: "",
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
	poly.on('mouseover', Util.scopeCallback(this, this.polyOnMouseOver));
	
	// hides the polygon and its tooltip
	poly.on('mouseout', Util.scopeCallback(this, this.polyOnMouseOut));
	
	// toggles the mouseout event for this poly
	// and the mouseover events for all other poly's
	poly.on('click', Util.scopeCallback(this, this.polyOnClick));
	
	return poly;
};

TagBoard.prototype.polyOnClick = function(event) {
	this.locked = !this.locked;
};

TagBoard.prototype.polyOnMouseOut = function(event) {
	if (!this.locked) {
		// draws the polygon as invisible again
		event.shape.attrs.fill = "";
		event.shape.attrs.stroke = "rgba(255,255,255,0)";
		
		// hides the tooltip and redraws the layer
		$('#taggable-tooltip').hide();
		this.layer.draw();
		
	}
};

TagBoard.prototype.polyOnMouseOver = function(event) {
	if (!this.locked) {
		// draws the shape on mouse over
		event.shape.attrs.fill = event.shape.color;
		event.shape.attrs.stroke = "black";
		var shape = event.shape;
		
		// positions the tag tooltip
		var pos = this.__getPolyPos(event.shape);
		pos[0] -= $('#taggable-tooltip').html(shape.description).width()/2;
		pos[1] -= $(window).scrollTop() - 20;
		$('#taggable-tooltip').css("left", pos[0] + "px").css("top", pos[1] + "px").show(); 
		this.layer.draw();
		
		// sets the selected tag for showing information
		var shapeId = event.shape.getId();
		this.selectedTag = this.tagGroups[this.currentTagGroup].getTags()[shapeId];
		//this.defaultInfoViewCallback(tags, shapeId, id);
	}
};

TagBoard.prototype.__getPolyPos = function(poly) {
	var pos = TaggableUtil.findPosition(this.board[0]);
	return [ pos[0] + poly.pos[0], pos[1] + poly.pos[1]];
};

TagBoard.prototype.__convertOriginalDataToTagGroups = function(originalData) {
	var tagGroups = [];
	
	for (group in originalData['tagGroups']) {
		tagGroups.push(new TagGroup(group, this.image.attr('id'), this.siteUrl));
	}
	
	return tagGroups;
};