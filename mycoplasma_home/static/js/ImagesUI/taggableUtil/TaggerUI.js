/**
	Creates a tagging application that links to the database using ajax
	
	Dependencies:
		1. All of the dependencies taggable.js 
**/
function TaggerUI(image, parent, originalData, title, genomicInfo, imagesUrl, alreadyLoaded, callback) {
	this.image = image;
	this.parent = parent;
	this.originalData = originalData;
	this.genomicInfo = genomicInfo;
	this.imagesUrl = imagesUrl;
	this.title = title;
	this.callback = callback;
	this.alreadyLoaded = alreadyLoaded;
	this.colors = [
   		{ colorRGB : 'rgb(255, 0, 0)'},
		{ colorRGB : 'rgb(0, 0, 255)'},
		{ colorRGB : 'rgb(0, 255, 255)'},
		{ colorRGB : 'rgb(0, 98, 0)'},
		{ colorRGB : 'rgb(0, 255, 0)'},
		{ colorRGB : 'rgb(255, 255, 0)'},
		{ colorRGB : 'rgb(192, 192, 192)'},
		{ colorRGB : 'rgb(0, 0, 0)'}
	];
	this.created = false;
	
	
	$(this.image).zoomable({
		callback: TaggableUtil.scopeCallback(this, this.createStructure),
		zoom_callback: TaggableUtil.scopeCallback(this, this.resizeCanvas),
		zoom_callback_args: [$(this.image).attr('id')],
		alreadyLoaded: this.alreadyLoaded
	});
};

TaggerUI.prototype.createStructure = function() {	
	// create the toolbar
	var id = this.image.attr('id');
	
	this.parent.prepend(this.__renderToolbar(id));
	this.__renderGeneLinksMenu();
	
	if ($('#taggable-tooltip').length == 0) {
		this.parent.parent().append('<div id="taggable-tooltip"></div>');
	}
	
	// creates the tag board and the drawing board
	var tagBoard = $('<div />', {
		id      : id + '-tag-board',
		'class' : 'tag-board'
	}).prependTo(this.image.parent());
	
	tagBoard.draggable();
	
	var drawingBoard = $('<canvas />', {
		id      : id + '-drawing-board',
		'class' : 'drawing-board'
	}).prependTo(this.image.parent());
	
	// creates the drawing API
	this.drawingAPI = new DrawingAPI(drawingBoard, tagBoard, this.originalData, this.image);
	
	var self = this;
	
	// events for clicking the start and stop drawing buttons
	$('#' + id + '-begin-tagging').live('click', function() {
		$(this).siblings('.add-tag-hidden').removeClass('add-tag-hidden').addClass('add-tag');
		$(this).addClass('add-tag-hidden').removeClass('add-tag');
		$('#' + id + '-toolbar-table-container').toggle();
		self.drawingAPI.startTagging();
	});
	
	$('#' + id + '-end-tagging').live('click', function() {
		$(this).siblings('.add-tag-hidden').removeClass('add-tag-hidden').addClass('add-tag');
		$(this).addClass('add-tag-hidden').removeClass('add-tag');
		$('#' + id + '-toolbar-table-container').toggle();
		self.drawingAPI.endTagging();
	});
	
	// changes the color of the currently drawn tag or just of the paint brush itself
	$('#' + id + '-color-toolbar button').on('click', function() {
		var color = $(this).css('background-color');
		
		var newFillStyle = "";
		if (color != "black") {
			var rgbArr = color.split("(")[1].split(")")[0].split(",");
			if (parseInt($.trim(rgbArr[0])) + parseInt($.trim(rgbArr[1])) + parseInt($.trim(rgbArr[2])) != 0) {
				newFillStyle = "rgba(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ", 0.5)"; 
			}
		}
		self.drawingAPI.setFillStyle(newFillStyle);
		self.drawingAPI.getDrawingBoard().redraw();
	});
	
	// buttons for switching between drawing in rectangular form and polygonal form
	$('#' + id + '-draw-rect').on('click', function() {
		self.drawingAPI.setShape('rect');
		self.drawingAPI.startTagging();
	});
	
	$('#' + id + '-draw-poly').on('click', function() {
		self.drawingAPI.setShape('poly');
		self.drawingAPI.startTagging();
	});
	
	// submits the currently drawn tag
	$('#' + id + '-submit-tag').on('click', function() {
		self.drawingAPI.saveTag();
	});
	
	var left = parseInt(this.image.css('left').split('px')[0]);
	var top = parseInt(this.image.css('top').split('px')[0]);
	
	// sizes everything correctly based on the image specifics
	// also draws the original tags if they exist
	this.created = true;
	this.resizeCanvas();
	
	// since the tagBoard has to be above the image we must make it drag the image with it
	this.drawingAPI.getTagBoard().getBoard().bind('drag', function(event, ui) {
		self.image.css('left', $(this).css('left')).css('top', $(this).css('top'));
		self.drawingAPI.getDrawingBoard().getBoard().css('left', $(this).css('left')).css('top', $(this).css('top'));
	});
	
	if (this.callback) {
		this.callback();
	}
};

TaggerUI.prototype.resizeCanvas = function() {
	if (this.created) {
		var $canvas = this.drawingAPI.getDrawingBoard().getBoard();
		var $tagBoard = this.drawingAPI.getTagBoard().getBoard();
		var $img = this.image;
		
		// drawing board
		$canvas.css('left', $img.css('left')).css('top', $img.css('top'));
		$canvas[0].height = $img.height();
		$canvas[0].width = $img.width();
		
		// tag board
		$tagBoard.css('left', $img.css('left')).css('top', $img.css('top'));
		$tagBoard.height($img.height());
		$tagBoard.width($img.width());
		
		this.drawingAPI.getTagBoard().redraw();
		this.drawingAPI.getDrawingBoard().redraw();
	}
};

TaggerUI.prototype.__renderToolbar = function(id) {
	var colorButtons = '';
	for (var i = 0; i < this.colors.length; i++) {
		colorButtons += '<button class="change-color toolbar-item" style="background-color: ' + this.colors[i].colorRGB + '"></button>';
	}
	var $render = $('<div class="toolbar-container"> \
		<span> \
			<img class="toolbar-icon" src="' + this.imagesUrl + 'tag.png"></img> \
		</span> \
		<span> \
			<img id="' + id + '-begin-tagging" class="add-tag toolbar-item" src="' + this.imagesUrl + 'button-play_green.png"></img> \
			<img id="' + id + '-end-tagging" class="add-tag-hidden toolbar-item" src="' + this.imagesUrl + 'button-pause_red.png"></img> \
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
								<img height="20px" src="' + this.imagesUrl + 'rectButtonIcon.png"></img> \
							</button> \
							<button id="'+ id + '-draw-poly" class="draw-poly draw-type toolbar-item"> \
								<img height="20px" src="' + this.imagesUrl + 'polygonButtonIcon.png"> \
							</button> \
						</td> \
					</tr> \
				</tbody> \
			</table> \
			<button id="' + id + '-submit-tag" class="submit-tag toolbar-item">Submit Tag</button> \
		</span> \
	</div>');
	return $render;
};

/**
 * Renders the Gene Links Menu UI which is in charge of adding new links 
 * to the current tag
**/
TaggerUI.prototype.__renderGeneLinksMenu = function() {
	var id = this.image.attr('id');
	
	// adds the title to the Gene Links Menu
	var genomicInfoTitle = $('<div />', {
		'class' : 'organismTitle',
		text : this.title
	});
	
	this.genomicInfo.html(genomicInfoTitle);
	
	// adds the geneLinks menu
	var geneLinksMenu = $('<div />', {
		'class' : 'geneLinksMenu'
	});
	
	// adds the form for adding a new gene link
	geneLinksMenu.append($('<div />', {
		'class' : 'geneLinkContainer'
	}));
	
	var newLinkInput = $('<input />', {
		type : 'text',
		id : 'newLink' + id
	});
	
	var formButton = $('<button />', {
		text : 'Add New Gene Link'
	});
	
	geneLinksMenu.append($('<div />', {
		'class' : 'newGeneLinkForm'
	}).append(newLinkInput).append(formButton));
	
	this.genomicInfo.append(geneLinksMenu);
	
	var speciesInfo = $('<div />', {
		'class' : 'speciesInfo'
	});
	
	speciesInfo.append(this.__renderSpeciesInfo());
	this.genomicInfo.append(speciesInfo);
	this.genomicInfo.attr('id', id + 'GeneLinkContainer');
};

/**
 * Renders the species info portion of the gene links menu,
 * which will be shown when no tag is moused over or clicked
 */
TaggerUI.prototype.__renderSpeciesInfo = function() {
	return $('<div />');
};