function DownloadImageDataDialog(pageBlock, image, siteUrl) {
	this.block = pageBlock;
	this.image = image;
	this.imageKey = image.attr('id');
	this.downloadUrl = this.siteUrl + 'images/getImageMetadata';
	this.dialog = $('<div />', {
		'class' : 'tagging-dialog',
	});
	
	this.block = pageBlock;
	
	this.title = $('<div />', {
		'class' : 'tagging-dialog-title',
		'text' : 'Download Image Data'
	});
	
	this.closeButton = $('<span />', {
		'class' : 'ui-icon ui-icon-circle-close close-button'
	});
	
	this.title.append(this.closeButton);
	
	this.contents = $('<div />', {
		'class' : 'tagging-dialog-contents'
	});
	
	this.dataStoreContent = this.createDataStoreContent();
	this.includedDataContent = this.createIncludedDataContent();
	
	this.contents.append(this.dataStoreContent);
	this.contents.append(this.includedDataContent);
	
	this.finalizeUI = $('<div />', {
		'class' : 'tagging-dialog-contents'
	});
	
	this.finalizeBody = $('<div />');
	
	this.submitTagGroupButton = $('<button />', {
		'class' : 'tagging-menu-button',
		'text': 'Download'
	});
	
	this.cancelButton = $('<button />', {
		'class' : 'tagging-menu-button',
		'text': 'Cancel',
		'style' : 'margin-left: 10px'
	});
	
	this.finalizeBody.append(this.submitTagGroupButton);
	this.finalizeBody.append(this.cancelButton);
	this.finalizeBody.css('border-top', '1px solid #CCC');
	this.finalizeBody.css('padding-top', '5px');
	
	this.finalizeUI.append(this.finalizeBody);
	
	
	this.dialog.append(this.title);
	this.dialog.append(this.contents);
	this.dialog.append(this.finalizeUI);
	
	this.submitCallback = null;
	
	this.submitTagGroupButton.on('click', Util.scopeCallback(this, this.onSubmit));
	this.cancelButton.on('click', Util.scopeCallback(this, this.onCancel));
	this.closeButton.on('click', Util.scopeCallback(this, this.onCancel));
	
	this.dialog.css('left', '28%').css('top', '25%');
	
	$('body').append(this.dialog);
};

DownloadImageDataDialog.prototype.setTagBoard = function(tagBoard) {
	this.tagBoard = tagBoard;
};

DownloadImageDataDialog.prototype.onSubmit = function() {
	var dataStore = $('input[type=radio]:checked', this.dataStoreContent).val();
	
	this.hide();
};

DownloadImageDataDialog.prototype.onCancel = function() {
	this.hide();
};

DownloadImageDataDialog.prototype.hide = function() {
	this.block.hide();
	$(window).off('resize');
	this.dialog.hide();
};

DownloadImageDataDialog.prototype.show = function() {
	this.block.show();
	var self = this;
	$(window).on('resize', function() {
		self.center($(this).width(), $(this).height());
	});
	this.center($(window).width(), $(window).height());
	this.dialog.show();
};

DownloadImageDataDialog.prototype.createDataStoreContent = function() {
	var dataStore = $('<div />', {
		
	});
	
	var dataStoreTitle = $('<div />', {
		'text' : 'Data Store',
		'class' : 'download-image-data-dialog-content-section-title'
	});
	
	var dataStoreTableContainer = $('<div />', {
		'class' : 'download-image-data-dialog-content-section'
	});
	
	var dataStoreTable = $('<table cellspacing="0" />');
	
	var dataStoreRow = $('<tr />');
	
	dataStoreTable.append(dataStoreRow);
	dataStoreTableContainer.append(dataStoreTable);
	dataStore.append(dataStoreTitle);
	dataStore.append(dataStoreTableContainer);
	
	var cached = $('<td />');
	
	cached.append($('<input />', {
		'type' : 'radio',
		'name' : 'dataStore',
		'checked' : true,
		'value' : 'cached'
	}));
	
	cached.append($('<span />', {
		'text' : 'Cached (Includes Unsaved Data)',
		'class' : ''
	}));
	
	var fresh = $('<td />');
	
	fresh.append($('<input />', {
		'type' : 'radio',
		'name' : 'dataStore',
		'class' : '',
		'value' : 'fresh'
	}));
	
	fresh.append($('<span />', {
		'text' : 'Fresh Data (Saved in Database)',
		'class' : ''
	}));
	
	dataStoreRow.append(cached);
	dataStoreRow.append(fresh);
	
	return dataStore;
};

DownloadImageDataDialog.prototype.createIncludedDataContent = function() {
	var includedData = $('<div />', {
		
	});
	
	var includedDataTitle = $('<div />', {
		'text' : 'Include what type of data in the download?',
		'class' : 'download-image-data-dialog-content-section-title'
	});
	
	var includedDataTableContainer = $('<div />', {
		'class' : 'download-image-data-dialog-content-section'
	});
	
	var includedDataTable = $('<table cellspacing="0" />');
	
	var includedDataRowOne = $('<tr />');
	var includedDataRowTwo = $('<tr />');
	var includedDataRowThree = $('<tr />');
	
	includedDataTable.append(includedDataRowOne);
	includedDataTable.append(includedDataRowTwo);
	includedDataTable.append(includedDataRowThree);
	includedDataTableContainer.append(includedDataTable);
	includedData.append(includedDataTitle);
	includedData.append(includedDataTableContainer);
	
	// First row of the table
	
	var urlOfImage = $('<td />');
	
	urlOfImage.append($('<input />', {
		'type' : 'checkbox',
		'name' : 'urlOfImage',
		'checked' : 'checked'
	}));
	
	urlOfImage.append($('<span />', {
		'text' : 'URL of Image',
		'class' : ''
	}));
	
	var imageFile = $('<td />');
	
	imageFile.append($('<input />', {
		'type' : 'checkbox',
		'name' : 'imageFile',
		'class' : '',
		'checked' : 'checked'
	}));
	
	imageFile.append($('<span />', {
		'text' : 'Image File',
		'class' : ''
	}));
	
	includedDataRowOne.append(urlOfImage);
	includedDataRowOne.append(imageFile);
	
	// Second row of the table
	
	var uploadDateUser = $('<td />');
	
	uploadDateUser.append($('<input />', {
		'type' : 'checkbox',
		'name' : 'uploadDateUser',
		'checked' : 'checked'
	}));
	
	uploadDateUser.append($('<span />', {
		'text' : 'Upload Date/User',
		'class' : ''
	}));
	
	var tagGroups = $('<td />');
	
	tagGroups.append($('<input />', {
		'type' : 'checkbox',
		'name' : 'tagGroups',
		'checked' : 'checked'
	}));
	
	tagGroups.append($('<span />', {
		'text' : 'Tag Groups'
	}));
	
	includedDataRowTwo.append(uploadDateUser);
	includedDataRowTwo.append(tagGroups);
	
	// Third row of the table
	
	var imageTags = $('<td />');
	
	imageTags.append($('<input />', {
		'type' : 'checkbox',
		'name' : 'imageTags',
		'checked' : 'checked'
	}));
	
	imageTags.append($('<span />', {
		'text' : 'Image Tags'
	}));
	
	var geneLinks = $('<td />');
	
	geneLinks.append($('<input />', {
		'type' : 'checkbox',
		'name' : 'geneLinks',
		'checked' : 'checked'
	}));
	
	geneLinks.append($('<span />', {
		'text' : 'Gene Links'
	}));
	
	includedDataRowThree.append(imageTags);
	includedDataRowThree.append(geneLinks);
	
	tagGroups.children('input').click(function() {   
	    if (!this.checked) {
	    	imageTags.children('input').attr("checked", false);
	        geneLinks.children('input').attr("checked", false);
	    }
	});
	
	imageTags.children('input').click(function() {   
	    if (this.checked) {
	        tagGroups.children('input').attr("checked", true);
	    }
	    else {
	    	geneLinks.children('input').attr("checked", false);
	    }
	});
	
	geneLinks.children('input').click(function() {   
	    if (this.checked) {
	        tagGroups.children('input').attr("checked", true);
	        imageTags.children('input').attr("checked", true);
	    }
	});
	
	return includedData;
};

DownloadImageDataDialog.prototype.center = function(width, height) {
	if (height > this.dialog.height()) {
		this.dialog.css('top', (height - this.dialog.height())/2 + 'px');
	}
	else {
		this.dialog.css('top', '0px');
	}
	
	this.dialog.css('left', (width - this.dialog.width())/2 + 'px');
};