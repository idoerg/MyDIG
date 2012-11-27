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
	
	$('body').append(this.dialog);
};

DownloadImageDataDialog.prototype.setTagBoard = function(tagBoard) {
	this.tagBoard = tagBoard;
};

DownloadImageDataDialog.prototype.addSubmitCallback = function(callback) {
	this.submitCallback = callback;
};

DownloadImageDataDialog.prototype.onSubmit = function() {
	this.hide();
};

DownloadImageDataDialog.prototype.onCancel = function() {
	this.hide();
};

DownloadImageDataDialog.prototype.hide = function() {
	this.block.hide();
	this.dialog.hide();
};

DownloadImageDataDialog.prototype.show = function() {
	var tagGroups = this.tagBoard.getTagGroups();
	var currentTagGroups = this.tagBoard.getCurrentTagGroups();
	this.contentTable.empty();
	if (this.tagBoard && tagGroups.length > 0) {
		var contentRow = null;
		for (var i = 0; i < tagGroups.length; i++) {
			var tagGroup = tagGroups[i];
			var entryClone = this.entry.clone();
			
			var checkbox = entryClone.children('.current-tag-group-checkbox');
			var text = entryClone.children('.current-tag-group-text');
			checkbox.val(i);
			
			if (currentTagGroups[tagGroup.getKey()]) {
				checkbox.attr("checked", "checked");
			}
			
			text.text(tagGroup.getName());
			
			if (i % 2 == 0) {
				contentRow = $('<tr />');
				this.contentTable.append(contentRow);
			}
			
			contentRow.append(entryClone);
		}
		
		this.block.show();
		this.dialog.show();
	}
	else {
		alert("No tag groups");
	}
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
		'class' : '',
		'value' : 'cached'
	}));
	
	cached.append($('<span />', {
		'text' : '',
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
		'text' : '',
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
	
	tagGroups.append($('<input />', {
		'type' : 'checkbox',
		'name' : 'geneLinks',
		'checked' : 'checked'
	}));
	
	tagGroups.append($('<span />', {
		'text' : 'Gene Links'
	}));
	
	includedDataRowThree.append(imageTags);
	includedDataRowThree.append(geneLinks);
	
	tagGroups.click(function() {   
	    if (!this.checked) {
	    	imageTags.attr("checked", "");
	        geneLinks.attr("checked", "");
	    }
	});
	
	imageTags.click(function() {   
	    if (this.checked) {
	        tagGroups.attr("checked", "checked");
	    }
	    else {
	    	geneLinks.attr("checked", "");
	    }
	});
	
	geneLinks.click(function() {   
	    if (this.checked) {
	        tagGroups.attr("checked", "checked");
	        imageTags.attr("checked", "checked");
	    }
	});
	
	return includedData;
};