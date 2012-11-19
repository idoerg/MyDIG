/**
	Creates a tagging application that links to the database using ajax
	
	Dependencies:
		1. All of the dependencies taggable.js 
**/
function TaggerUI(image, parent, originalData, organisms, genomicInfo, imagesUrl, siteUrl, alreadyLoaded, callback) {
	this.image = image;
	this.parent = parent;
	this.originalData = originalData;
	this.genomicInfo = genomicInfo;
	this.imagesUrl = imagesUrl;
	this.siteUrl = siteUrl;
	this.organisms = organisms;
	this.title = "";
	this.callback = callback;
	this.alreadyLoaded = alreadyLoaded;
	this.created = false;
	
	for (var i = 0; i < organisms.length; i++) {
		this.title += organisms[i].common_name;
		if (i < organisms.length - 1) {
			this.title += ", ";
		}
	}
	
	$(this.image).zoomable({
		callback: Util.scopeCallback(this, this.createStructure),
		zoom_callback: Util.scopeCallback(this, this.resizeCanvas),
		zoom_callback_args: [$(this.image).attr('id')],
		alreadyLoaded: this.alreadyLoaded
	});
};

TaggerUI.prototype.createStructure = function() {	
	// create the toolbar
	var id = this.image.attr('id');
	
	this.menu = this.getToolbar(id);
	this.taggingMenu = this.getTaggingMenu(id);
	
	this.parent.prepend(this.menu.getUI());
	this.parent.prepend(this.taggingMenu.getUI());
	
	this.__renderGeneLinksMenu();
	
	var pageBlock = new PageBlock();
	var saveTagDialog = new SaveTagDialog(pageBlock);
	var newTagGroupDialog = new NewTagGroupDialog(pageBlock);
	
	var dialogs = {
		'saveTags' : saveTagDialog,
		'newTagGroup' : newTagGroupDialog
	};
	
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
	this.drawingAPI = new DrawingAPI(drawingBoard, tagBoard, dialogs, this.siteUrl, this.originalData, this.image, this.organisms);
	
	var $tagGroupSelect = this.parent.find('#' + id + '-tag-groups');
	var groups = this.drawingAPI.getTagBoard().getTagGroups();
	for (key in groups) {
		var group = groups[key];
		$tagGroupSelect.append($('<option />', {
			'text' : group.getName(),
			'name' : group.getKey()
		}));
	}
	
	var self = this;
	
	// events for clicking the start and stop drawing buttons
	this.menu.getSection('tags').getMenuItem('addNewTag').onClick(function() {
		self.drawingAPI.startTagging();
		self.taggingMenu.show();
	});
	
	this.menu.getSection('tagGroups').getMenuItem('addNewTagGroup').onClick(function() {
		newTagGroupDialog.show();
	});
	
	this.taggingMenu.onCancelClick(function() {
		self.drawingAPI.endTagging();
	});	
	
	// changes the color of the currently drawn tag or just of the paint brush itself
	this.taggingMenu.onColorClick(function() {
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
	this.taggingMenu.onRectClick(function() {
		self.drawingAPI.setShape('rect');
		self.drawingAPI.startTagging();
	});
	
	this.taggingMenu.onPolyClick(function() {
		self.drawingAPI.setShape('poly');
		self.drawingAPI.startTagging();
	});
	
	
	// submits the currently drawn tag
	this.taggingMenu.onSubmitClick(function() {
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

TaggerUI.prototype.getToolbar = function(id) {
	/*
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
			<button id="' + id + '-submit-tag" class="submit-tag taggable-button toolbar-item">Submit Tag</button> \
		</span> \
		<span style="float: right; margin-top: 13px;"> \
			<select id="' + id + '-tag-groups"></select> \
			<button id="' + id + '-new-tag-group" class="taggable-button">New Tag Group</button> \
		</span> \
	</div>');
	return $render;
	*/
	var menu = new Menu();
	
	// create tools menu section
	var tools = new MenuSection('Tools', this.imagesUrl + 'tools.png');
	tools.addMenuItem('download', 'Download Image Data', 'ui-icon ui-icon-disk', false);
	tools.addMenuItem('zoomIn', 'Zoom In', 'ui-icon ui-icon-zoomin', false);
	tools.addMenuItem('zoomOut', 'Zoom Out', 'ui-icon ui-icon-zoomout', false);
	menu.addNewSection('tools', tools);
	
	// create tag groups menu section
	var tagGroups = new MenuSection('Tag Groups', this.imagesUrl + 'tag.png');
	tagGroups.addMenuItem('addNewTagGroup', 'Add New Tag Group', 'ui-icon ui-icon-plusthick', false);
	tagGroups.addMenuItem('changeCurrentGroups', 'Change Current Tag Groups', 'ui-icon ui-icon-pencil', false);
	menu.addNewSection('tagGroups', tagGroups);
	
	// create tag groups menu section
	var tags = new MenuSection('Tags', this.imagesUrl + 'tag.png');
	tags.addMenuItem('addNewTag', 'Add New Tag', 'ui-icon ui-icon-plusthick', false);
	tags.addMenuItem('editTag', 'Edit Tag', 'ui-icon ui-icon-pencil', false);
	tags.addMenuItem('deleteTag', 'Delete Tag', 'ui-icon ui-icon-trash', false);
	menu.addNewSection('tags', tags);
	
	return menu;
};

TaggerUI.prototype.getTaggingMenu = function(id) {
	return new TaggingMenu(id, this.imagesUrl);
}

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